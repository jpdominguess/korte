import type { Prisma, PrismaClient } from "@prisma/client";
import type { PlanDTO } from "@/application/dto";
import type { PlanRepository } from "@/application/ports";
import { Plan } from "@/domain/entities/plan";
import { toLocalDate } from "@/domain/shared/time";

const include = {
  services: { include: { service: true } },
  subscriptions: { select: { cycleEnd: true, canceledAt: true } },
} satisfies Prisma.PlanInclude;

type Row = Prisma.PlanGetPayload<{ include: typeof include }>;

function toEntity(row: Row) {
  return new Plan({
    name: row.name,
    price: row.price.toNumber(),
    usesPerCycle: row.usesPerCycle,
    active: row.active,
    serviceIds: row.services.map((s) => s.serviceId),
  });
}

function toDTO(row: Row): PlanDTO {
  const today = new Date(`${toLocalDate(new Date())}T00:00:00Z`);
  return {
    id: row.id,
    name: row.name,
    price: row.price.toNumber(),
    usesPerCycle: row.usesPerCycle,
    active: row.active,
    serviceIds: row.services.map((s) => s.serviceId),
    serviceNames: row.services.map((s) => s.service.name),
    activeSubscribers: row.subscriptions.filter((s) => !s.canceledAt && s.cycleEnd >= today).length,
  };
}

function columns(plan: Plan) {
  return { name: plan.name, price: plan.price, usesPerCycle: plan.usesPerCycle, active: plan.active };
}

export class PrismaPlanRepository implements PlanRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(filter?: { onlyActive?: boolean }) {
    const rows = await this.db.plan.findMany({
      where: filter?.onlyActive ? { active: true } : undefined,
      include,
      orderBy: { name: "asc" },
    });
    return rows.map(toDTO);
  }

  async findById(id: string) {
    const row = await this.db.plan.findUnique({ where: { id }, include });
    return row && toEntity(row);
  }

  async create(plan: Plan) {
    const row = await this.db.plan.create({
      data: { ...columns(plan), services: { create: plan.serviceIds.map((serviceId) => ({ serviceId })) } },
      select: { id: true },
    });
    return row.id;
  }

  async update(id: string, plan: Plan) {
    await this.db.plan.update({
      where: { id },
      data: {
        ...columns(plan),
        services: { deleteMany: {}, create: plan.serviceIds.map((serviceId) => ({ serviceId })) },
      },
    });
  }
}
