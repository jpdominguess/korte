import type { Prisma } from "@prisma/client";
import type { NewSubscription, SubscriptionRepository, SubscriptionRow } from "@/application/ports";
import { Subscription, type SubscriptionProps } from "@/domain/entities/subscription";
import { DomainError } from "@/domain/shared/errors";
import { toLocalDate } from "@/domain/shared/time";
import type { Database } from "../prisma/client";

const include = { client: true, plan: true } satisfies Prisma.SubscriptionInclude;
type Row = Prisma.SubscriptionGetPayload<{ include: typeof include }>;

const toDateString = (date: Date) => date.toISOString().slice(0, 10);
const toDate = (date: string) => new Date(`${date}T00:00:00Z`);

function toProps(row: Omit<Row, "client" | "plan">): SubscriptionProps {
  return {
    id: row.id,
    clientId: row.clientId,
    planId: row.planId,
    cycleStart: toDateString(row.cycleStart),
    cycleEnd: toDateString(row.cycleEnd),
    totalUses: row.totalUses,
    usedUses: row.usedUses,
    canceledAt: row.canceledAt,
  };
}

function toRow(row: Row): SubscriptionRow {
  return {
    ...toProps(row),
    clientName: row.client.name,
    clientPhone: row.client.phone,
    planName: row.plan.name,
    planPrice: row.plan.price.toNumber(),
  };
}

export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly db: Database) {}

  async list() {
    const rows = await this.db.subscription.findMany({ include, orderBy: { cycleEnd: "desc" } });
    return rows.map(toRow);
  }

  async findById(id: string) {
    const row = await this.db.subscription.findUnique({ where: { id } });
    return row && new Subscription(toProps(row));
  }

  async findActiveByClient(clientId: string, today: string) {
    const row = await this.db.subscription.findFirst({
      where: { clientId, canceledAt: null, cycleStart: { lte: toDate(today) }, cycleEnd: { gte: toDate(today) } },
      orderBy: [{ cycleStart: "desc" }, { cycleEnd: "desc" }, { id: "desc" }],
    });
    return row && new Subscription(toProps(row));
  }

  async findLatestRowByClient(clientId: string, today: string) {
    const orderBy = [{ cycleStart: "desc" }, { cycleEnd: "desc" }, { id: "desc" }] satisfies Prisma.SubscriptionOrderByWithRelationInput[];
    // Uma assinatura cancelada no mesmo dia não pode esconder a nova assinatura ativa.
    const active = await this.db.subscription.findFirst({
      where: { clientId, canceledAt: null, cycleStart: { lte: toDate(today) }, cycleEnd: { gte: toDate(today) } },
      include,
      orderBy,
    });
    if (active) return toRow(active);
    const row = await this.db.subscription.findFirst({
      where: { clientId }, include, orderBy: [{ cycleStart: "desc" }, { canceledAt: "desc" }, { id: "desc" }],
    });
    return row && toRow(row);
  }

  async create(data: NewSubscription) {
    const row = await this.db.subscription.create({
      data: { ...data, cycleStart: toDate(data.cycleStart), cycleEnd: toDate(data.cycleEnd) },
      select: { id: true },
    });
    return row.id;
  }

  async save(subscription: Subscription) {
    await this.db.subscription.update({
      where: { id: subscription.id },
      data: {
        cycleStart: toDate(subscription.cycleStart),
        cycleEnd: toDate(subscription.cycleEnd),
        totalUses: subscription.totalUses,
        usedUses: subscription.usedUses,
        canceledAt: subscription.canceledAt,
      },
    });
  }

  async registerUse(subscriptionId: string, appointmentId: string, usedAt: Date) {
    const today = toLocalDate(usedAt);
    // A condição no UPDATE impede saldo negativo mesmo com conclusões simultâneas.
    const updated = await this.db.$executeRaw`
      UPDATE "subscription" SET "used_uses" = "used_uses" + 1
      WHERE "id" = ${subscriptionId}::uuid AND "used_uses" < "total_uses"
        AND "canceled_at" IS NULL
        AND "cycle_start" <= ${today}::date
        AND "cycle_end" >= ${today}::date`;
    if (updated === 0) throw new DomainError("A assinatura não tem usos disponíveis.", "conflict");
    await this.db.subscriptionUsage.create({ data: { subscriptionId, appointmentId, usedAt } });
  }
}
