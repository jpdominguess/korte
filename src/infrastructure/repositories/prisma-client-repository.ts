import type { PrismaClient } from "@prisma/client";
import type { ClientRepository } from "@/application/ports";

const select = { id: true, name: true, phone: true };

export class PrismaClientRepository implements ClientRepository {
  constructor(private readonly db: PrismaClient) {}

  list() {
    return this.db.user.findMany({ where: { role: "CLIENT" }, select, orderBy: { name: "asc" } });
  }

  findById(id: string) {
    return this.db.user.findFirst({ where: { id, role: "CLIENT" }, select });
  }
}
