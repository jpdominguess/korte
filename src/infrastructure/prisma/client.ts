import { PrismaClient, type Prisma } from "@prisma/client";

/** O cliente normal ou o de uma transação em andamento. */
export type Database = PrismaClient | Prisma.TransactionClient;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
