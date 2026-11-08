import type { PrismaClient } from "@prisma/client";
import type { BarbershopData, BarbershopRepository } from "@/application/ports";

export class PrismaBarbershopRepository implements BarbershopRepository {
  constructor(private readonly db: PrismaClient) {}

  get() {
    return this.db.barbershop.findFirst({
      select: {
        id: true,
        name: true,
        cep: true,
        street: true,
        number: true,
        city: true,
        phone: true,
        whatsapp: true,
        logoUrl: true,
      },
    });
  }

  async update(data: BarbershopData) {
    await this.db.barbershop.updateMany({ data });
  }
}
