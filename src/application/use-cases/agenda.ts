import { DomainError, forbidden, notFound } from "@/domain/shared/errors";
import { toLocalDate } from "@/domain/shared/time";
import { Payment, type PaymentMethod } from "@/domain/entities/payment";
import type { User } from "@/domain/entities/user";
import type { AgendaDTO } from "../dto";
import type {
  AppointmentRepository,
  ClientRepository,
  PlanRepository,
  ScheduleBlockRepository,
  UnitOfWork,
  WorkScheduleRepository,
} from "../ports";

export class GetAgenda {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly blocks: ScheduleBlockRepository,
    private readonly workSchedules: WorkScheduleRepository,
  ) {}

  /** Dono vê a agenda geral ou a de um profissional; barbeiro, só a própria. */
  async execute(actor: User, filter: { from: Date; to: Date; barberProfileId?: string }): Promise<AgendaDTO> {
    actor.assertStaff();
    const barberProfileId = actor.isOwner() ? filter.barberProfileId : (actor.barberProfileId ?? undefined);
    if (!actor.isOwner() && !barberProfileId) throw forbidden();

    const period = { from: filter.from, to: filter.to, barberProfileId };
    const [appointments, blocks, allIntervals] = await Promise.all([
      this.appointments.list(period),
      this.blocks.list(period),
      this.workSchedules.listAll(),
    ]);
    return {
      appointments,
      blocks,
      workIntervals: barberProfileId ? allIntervals.filter((i) => i.barberProfileId === barberProfileId) : allIntervals,
    };
  }
}

export class ListClients {
  constructor(private readonly clients: ClientRepository) {}

  execute(actor: User) {
    actor.assertStaff();
    return this.clients.list();
  }
}

export class ListClientAppointments {
  constructor(private readonly appointments: AppointmentRepository) {}

  execute(actor: User) {
    actor.assertClient();
    return this.appointments.listByClient(actor.id);
  }
}

export class CancelAppointment {
  constructor(private readonly appointments: AppointmentRepository) {}

  async execute(actor: User, id: string, now = new Date()) {
    const appointment = await this.appointments.findById(id);
    if (!appointment) throw notFound("Agendamento");
    appointment.cancel(actor, now);
    await this.appointments.saveStatus(appointment);
  }
}

export class MarkNoShow {
  constructor(private readonly appointments: AppointmentRepository) {}

  async execute(actor: User, id: string, now = new Date()) {
    actor.assertStaff();
    const appointment = await this.appointments.findById(id);
    if (!appointment) throw notFound("Agendamento");
    actor.assertCanManage(appointment);
    appointment.markNoShow(now);
    await this.appointments.saveStatus(appointment);
  }
}

export interface CompleteAppointmentInput {
  useSubscription: boolean;
  amount?: number;
  method?: PaymentMethod;
}

export class CompleteAppointment {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly plans: PlanRepository,
  ) {}

  /** Situação, pagamento e consumo da assinatura são gravados juntos, na mesma transação. */
  async execute(actor: User, id: string, input: CompleteAppointmentInput, now = new Date()) {
    actor.assertStaff();
    await this.unitOfWork.run(async ({ appointments, payments, subscriptions }) => {
      const appointment = await appointments.findById(id);
      if (!appointment) throw notFound("Agendamento");
      actor.assertCanManage(appointment);

      if (input.useSubscription) {
        const today = toLocalDate(now);
        const subscription = appointment.clientId && (await subscriptions.findActiveByClient(appointment.clientId, today));
        if (!subscription) throw new DomainError("Este cliente não tem assinatura ativa.");
        const plan = await this.plans.findById(subscription.planId);
        if (!plan?.covers(appointment.serviceId)) throw new DomainError("O plano do cliente não cobre este serviço.");

        appointment.completeWithSubscription(subscription, today);
        await appointments.saveStatus(appointment);
        await subscriptions.registerUse(subscription.id, appointment.id, now);
        return;
      }

      if (input.amount === undefined) throw new DomainError("Informe o valor.");
      if (!input.method) throw new DomainError("Escolha a forma de pagamento.");
      appointment.complete();
      await appointments.saveStatus(appointment);
      await payments.create({
        appointmentId: id,
        subscriptionId: null,
        payment: new Payment(input.amount, input.method, "APPOINTMENT", now),
      });
    });
  }
}

export class GetAppointmentDetails {
  constructor(private readonly appointments: AppointmentRepository) {}

  async execute(actor: User, id: string) {
    const appointment = await this.appointments.findDetails(id);
    if (!appointment) throw notFound("Agendamento");
    if (actor.isClient() ? appointment.clientId !== actor.id : !actor.canManage(appointment)) throw forbidden();
    return appointment;
  }
}
