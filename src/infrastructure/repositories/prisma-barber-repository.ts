import type { Prisma, PrismaClient } from "@prisma/client";
import type { BarberDTO } from "@/application/dto";
import type { BarberRepository, BarberUpdate, TeamRole } from "@/application/ports";

const include = { user: true, services: true } satisfies Prisma.BarberProfileInclude;
type Row = Prisma.BarberProfileGetPayload<{ include: typeof include }>;

function toDTO(row: Row): BarberDTO {
  return {
    id: row.id,
    userId: row.userId,
    name: row.user.name,
    email: row.user.email,
    phone: row.user.phone,
    photoUrl: row.user.image ? `/api/barbeiros/${row.id}/foto?v=${row.user.updatedAt.getTime()}` : null,
    active: row.active,
    isOwner: row.user.role === "OWNER",
    serviceIds: row.services.map((s) => s.serviceId),
  };
}

export class PrismaBarberRepository implements BarberRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(filter?: { onlyActive?: boolean }) {
    const rows = await this.db.barberProfile.findMany({
      where: filter?.onlyActive ? { active: true } : undefined,
      include,
      orderBy: { user: { name: "asc" } },
    });
    return rows.map(toDTO);
  }

  async findById(id: string) {
    const row = await this.db.barberProfile.findUnique({ where: { id }, include });
    return row && toDTO(row);
  }

  async findByUserId(userId: string) {
    const row = await this.db.barberProfile.findUnique({ where: { userId }, include });
    return row && toDTO(row);
  }

  async create(userId: string, serviceIds: string[]) {
    const row = await this.db.barberProfile.create({
      data: { userId, services: { create: serviceIds.map((serviceId) => ({ serviceId })) } },
    });
    return row.id;
  }

  async update(id: string, data: BarberUpdate) {
    await this.db.barberProfile.update({
      where: { id },
      data: {
        active: data.active,
        user: { update: { name: data.name, phone: data.phone } },
        services: {
          deleteMany: {},
          create: data.serviceIds.map((serviceId) => ({ serviceId })),
        },
      },
    });
  }

  async setActive(id: string, active: boolean) {
    await this.db.barberProfile.update({ where: { id }, data: { active } });
  }

  async getPhoto(id: string) {
    const row = await this.db.barberProfile.findUnique({ where: { id }, select: { user: { select: { image: true } } } });
    return row?.user.image ?? null;
  }

  async setRole(id: string, role: TeamRole) {
    await this.db.barberProfile.update({ where: { id }, data: { user: { update: { role } } } });
  }

  async setPhoto(id: string, photo: string | null) {
    await this.db.barberProfile.update({ where: { id }, data: { user: { update: { image: photo } } } });
  }
}
