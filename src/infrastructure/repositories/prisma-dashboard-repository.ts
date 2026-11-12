import type { PrismaClient } from "@prisma/client";
import type { DashboardRepository } from "@/application/ports";
import type { PaymentOrigin } from "@/domain/entities/payment";

export class PrismaDashboardRepository implements DashboardRepository {
  constructor(private readonly db: PrismaClient) {}

  async listPayments(from: Date, to: Date) {
    const rows = await this.db.payment.findMany({
      where: { paidAt: { gte: from, lt: to } },
      select: { amount: true, origin: true, paidAt: true, appointment: { select: { barberProfileId: true, barberProfile: { select: { user: { select: { name: true } } } } } } },
    });
    return rows.map((row) => ({
      amount: row.amount.toNumber(),
      origin: row.origin as PaymentOrigin,
      paidAt: row.paidAt,
      barberProfileId: row.appointment?.barberProfileId ?? null,
      barberName: row.appointment?.barberProfile.user.name ?? null,
    }));
  }

  async listCompleted(from: Date, to: Date) {
    const rows = await this.db.appointment.findMany({
      where: { status: "CONCLUIDO", startsAt: { gte: from, lt: to } },
      select: {
        barberProfileId: true,
        usage: { select: { id: true } },
        barberProfile: { select: { user: { select: { name: true } } } },
      },
    });
    return rows.map((row) => ({
      barberProfileId: row.barberProfileId,
      barberName: row.barberProfile.user.name,
      covered: row.usage !== null,
    }));
  }

  countActiveSubscriptions(today: string) {
    return this.db.subscription.count({
      where: { canceledAt: null, cycleEnd: { gte: new Date(`${today}T00:00:00Z`) } },
    });
  }
}
