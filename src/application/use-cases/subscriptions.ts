import { Payment, type PaymentMethod } from "@/domain/entities/payment";
import { Plan, type PlanProps } from "@/domain/entities/plan";
import { Subscription } from "@/domain/entities/subscription";
import type { User } from "@/domain/entities/user";
import { DomainError, notFound } from "@/domain/shared/errors";
import { toLocalDate } from "@/domain/shared/time";
import type { AppointmentDTO, ClientSubscriptionDTO, SubscriptionCoverageDTO, SubscriptionDTO } from "../dto";
import type { ClientRepository, PlanRepository, SubscriptionRepository, SubscriptionRow, UnitOfWork } from "../ports";

function toDTO(row: SubscriptionRow, today: string): SubscriptionDTO {
  const subscription = new Subscription(row);
  return {
    id: row.id,
    clientId: row.clientId,
    clientName: row.clientName,
    clientPhone: row.clientPhone,
    planId: row.planId,
    planName: row.planName,
    planPrice: row.planPrice,
    cycleStart: row.cycleStart,
    cycleEnd: row.cycleEnd,
    totalUses: row.totalUses,
    usedUses: row.usedUses,
    remainingUses: subscription.remainingUses,
    canceledAt: row.canceledAt,
    situation: subscription.situation(today),
  };
}

export class ListPlans {
  constructor(private readonly plans: PlanRepository) {}

  execute(filter?: { onlyActive?: boolean }) {
    return this.plans.list(filter);
  }
}

export class CreatePlan {
  constructor(private readonly plans: PlanRepository) {}

  execute(actor: User, props: PlanProps) {
    actor.assertOwner();
    return this.plans.create(new Plan(props));
  }
}

export class UpdatePlan {
  constructor(private readonly plans: PlanRepository) {}

  async execute(actor: User, id: string, props: PlanProps) {
    actor.assertOwner();
    if (!(await this.plans.findById(id))) throw notFound("Plano");
    await this.plans.update(id, new Plan(props));
  }
}

export class ListSubscriptions {
  constructor(private readonly subscriptions: SubscriptionRepository) {}

  async execute(actor: User, now = new Date()) {
    actor.assertOwner();
    const today = toLocalDate(now);
    const rows = await this.subscriptions.list();
    return rows.map((row) => toDTO(row, today));
  }
}

export interface PaymentInput {
  amount: number;
  method: PaymentMethod;
}

export class ActivateSubscription {
  constructor(
    private readonly clients: ClientRepository,
    private readonly plans: PlanRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(actor: User, input: PaymentInput & { clientId: string; planId: string }, now = new Date()) {
    actor.assertOwner();
    const today = toLocalDate(now);
    const [client, plan] = await Promise.all([this.clients.findById(input.clientId), this.plans.findById(input.planId)]);
    if (!client) throw notFound("Cliente");
    if (!plan?.active) throw new DomainError("Plano indisponível.");

    return this.unitOfWork.run(async ({ subscriptions, payments }) => {
      if (await subscriptions.findActiveByClient(input.clientId, today)) {
        throw new DomainError("Este cliente já tem uma assinatura ativa.", "conflict");
      }
      const id = await subscriptions.create({
        clientId: input.clientId,
        planId: input.planId,
        ...Subscription.firstCycle(today, plan.usesPerCycle),
      });
      await payments.create({
        appointmentId: null,
        subscriptionId: id,
        payment: new Payment(input.amount, input.method, "ACTIVATION", now),
      });
      return id;
    });
  }
}

export class RenewSubscription {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(actor: User, id: string, input: PaymentInput, now = new Date()) {
    actor.assertOwner();
    await this.unitOfWork.run(async ({ subscriptions, payments, plans }) => {
      const subscription = await subscriptions.findById(id);
      if (!subscription) throw notFound("Assinatura");
      const active = await subscriptions.findActiveByClient(subscription.clientId, toLocalDate(now));
      if (active && active.id !== subscription.id) {
        throw new DomainError("Este cliente já tem outra assinatura ativa.", "conflict");
      }
      const plan = await plans.findById(subscription.planId);
      if (!plan) throw notFound("Plano");

      subscription.renew(toLocalDate(now), plan.usesPerCycle);
      await subscriptions.save(subscription);
      await payments.create({
        appointmentId: null,
        subscriptionId: id,
        payment: new Payment(input.amount, input.method, "RENEWAL", now),
      });
    });
  }
}

export class CancelSubscription {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(actor: User, id: string, now = new Date()) {
    actor.assertOwner();
    await this.unitOfWork.run(async ({ subscriptions }) => {
      const subscription = await subscriptions.findById(id);
      if (!subscription) throw notFound("Assinatura");
      subscription.cancel(now);
      await subscriptions.save(subscription);
    });
  }
}

export class GetClientSubscription {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly plans: PlanRepository,
  ) {}

  /** Prioriza a assinatura ativa; sem ela, mostra a mais recente do histórico. */
  async execute(actor: User, now = new Date()): Promise<ClientSubscriptionDTO | null> {
    actor.assertClient();
    const row = await this.subscriptions.findLatestRowByClient(actor.id, toLocalDate(now));
    if (!row) return null;
    const plan = await this.plans.findById(row.planId);
    return { ...toDTO(row, toLocalDate(now)), coveredServiceIds: plan?.serviceIds ?? [] };
  }
}

export class GetSubscriptionCoverage {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly plans: PlanRepository,
  ) {}

  /** Informa se o atendimento pode usar a assinatura do cliente. */
  async execute(actor: User, appointment: AppointmentDTO, now = new Date()): Promise<SubscriptionCoverageDTO | null> {
    actor.assertStaff();
    if (!appointment.clientId) return null;
    const today = toLocalDate(now);
    const subscription = await this.subscriptions.findActiveByClient(appointment.clientId, today);
    if (!subscription) return null;
    const plan = await this.plans.findById(subscription.planId);
    if (!plan) return null;

    return {
      planName: plan.name,
      remainingUses: subscription.remainingUses,
      totalUses: subscription.totalUses,
      cycleEnd: subscription.cycleEnd,
      covered: plan.covers(appointment.serviceId) && subscription.isUsable(today),
    };
  }
}
