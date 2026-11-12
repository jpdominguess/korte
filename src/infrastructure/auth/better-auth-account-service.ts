import { Prisma, type PrismaClient } from "@prisma/client";
import type { AccountService, NewBarberAccount } from "@/application/ports";
import { DomainError } from "@/domain/shared/errors";
import { prisma } from "../prisma/client";
import { auth } from "./auth";

export class BetterAuthAccountService implements AccountService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async createBarberAccount(account: NewBarberAccount) {
    const context = await auth.$context;
    const email = account.email.toLowerCase();
    const password = await context.password.hash(account.password);
    const userId = crypto.randomUUID();

    try {
      // Uma escrita aninhada é atômica: falhar em qualquer vínculo desfaz o cadastro inteiro.
      const profile = await this.db.barberProfile.create({
        data: {
          user: {
            create: {
              id: userId,
              name: account.name,
              email,
              phone: account.phone,
              role: account.role,
              emailVerified: true,
              image: account.photo,
              accounts: {
                create: { id: crypto.randomUUID(), providerId: "credential", accountId: userId, password },
              },
            },
          },
          services: { create: account.serviceIds.map((serviceId) => ({ serviceId })) },
        },
        select: { id: true },
      });
      return profile.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" &&
          Array.isArray(error.meta?.target) && error.meta.target.includes("email")) {
        throw new DomainError("Já existe uma conta com esse e-mail.", "conflict");
      }
      throw error;
    }
  }
}
