import type { NewPayment, PaymentRepository } from "@/application/ports";
import type { Database } from "../prisma/client";

export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly db: Database) {}

  async create({ appointmentId, subscriptionId, payment }: NewPayment) {
    await this.db.payment.create({
      data: {
        appointmentId,
        subscriptionId,
        amount: payment.amount,
        method: payment.method,
        origin: payment.origin,
        paidAt: payment.paidAt,
      },
    });
  }
}
