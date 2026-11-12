import { Prisma, type PrismaClient } from "@prisma/client";
import type { TransactionRepositories, UnitOfWork } from "@/application/ports";
import { DomainError } from "@/domain/shared/errors";
import { PrismaAppointmentRepository } from "../repositories/prisma-appointment-repository";
import { PrismaBarberRepository } from "../repositories/prisma-barber-repository";
import { PrismaPaymentRepository } from "../repositories/prisma-payment-repository";
import { PrismaPlanRepository } from "../repositories/prisma-plan-repository";
import { PrismaScheduleBlockRepository } from "../repositories/prisma-schedule-block-repository";
import { PrismaServiceRepository } from "../repositories/prisma-service-repository";
import { PrismaSubscriptionRepository } from "../repositories/prisma-subscription-repository";
import { PrismaWorkScheduleRepository } from "../repositories/prisma-work-schedule-repository";

export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly db: PrismaClient) {}

  async run<T>(work: (repositories: TransactionRepositories) => Promise<T>): Promise<T> {
    // Reexecuta a validação quando outra operação altera os dados durante a transação.
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.db.$transaction(
          (tx) => work({
            appointments: new PrismaAppointmentRepository(tx),
            payments: new PrismaPaymentRepository(tx),
            subscriptions: new PrismaSubscriptionRepository(tx),
            services: new PrismaServiceRepository(tx),
            barbers: new PrismaBarberRepository(tx),
            workSchedules: new PrismaWorkScheduleRepository(tx),
            blocks: new PrismaScheduleBlockRepository(tx),
            plans: new PrismaPlanRepository(tx),
          }),
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          const code = error.code === "P2010" ? error.meta?.code : error.code;
          if (code === "P2034" || code === "40001" || code === "40P01") {
            if (attempt < 2) continue;
            throw new DomainError("Os dados foram alterados por outra operação. Tente novamente.", "conflict");
          }
        }
        throw error;
      }
    }
  }
}
