import type { Prisma } from "@prisma/client";
import type { Database } from "../prisma/client";
import type { ServiceDTO } from "@/application/dto";
import type { ServiceRepository } from "@/application/ports";
import type { ServiceProps } from "@/domain/entities/service";

const include = { barbers: true } satisfies Prisma.ServiceInclude;
type Row = Prisma.ServiceGetPayload<{ include: typeof include }>;

function toDTO(row: Row): ServiceDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    durationMin: row.durationMin,
    price: row.price.toNumber(),
    active: row.active,
    barberIds: row.barbers.map((b) => b.barberProfileId),
  };
}

function columns(data: ServiceProps) {
  return {
    name: data.name,
    description: data.description,
    durationMin: data.durationMin,
    price: data.price,
    active: data.active,
  };
}

export class PrismaServiceRepository implements ServiceRepository {
  constructor(private readonly db: Database) {}

  async list(filter?: { onlyActive?: boolean }) {
    const rows = await this.db.service.findMany({
      where: filter?.onlyActive ? { active: true } : undefined,
      include,
      orderBy: { name: "asc" },
    });
    return rows.map(toDTO);
  }

  async findById(id: string) {
    const row = await this.db.service.findUnique({ where: { id }, include });
    return row && toDTO(row);
  }

  async create(data: ServiceProps, barberIds: string[]) {
    const row = await this.db.service.create({
      data: {
        ...columns(data),
        barbers: { create: barberIds.map((barberProfileId) => ({ barberProfileId })) },
      },
    });
    return row.id;
  }

  async update(id: string, data: ServiceProps, barberIds: string[]) {
    await this.db.service.update({
      where: { id },
      data: {
        ...columns(data),
        barbers: {
          deleteMany: {},
          create: barberIds.map((barberProfileId) => ({ barberProfileId })),
        },
      },
    });
  }
}
