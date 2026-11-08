import type { PrismaClient } from "@prisma/client";
import type { TransactionRepositories, UnitOfWork } from "@/application/ports";
import { PrismaAppointmentRepository } from "../repositories/prisma-appointment-repository";
import { PrismaPaymentRepository } from "../repositories/prisma-payment-repository";

export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly db: PrismaClient) {}

  run<T>(work: (repositories: TransactionRepositories) => Promise<T>) {
    return this.db.$transaction((tx) =>
      work({
        appointments: new PrismaAppointmentRepository(tx),
        payments: new PrismaPaymentRepository(tx),
      }),
    );
  }
}
