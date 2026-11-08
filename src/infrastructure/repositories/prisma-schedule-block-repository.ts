import type { PrismaClient } from "@prisma/client";
import type { NewScheduleBlock, PeriodFilter, ScheduleBlockRepository } from "@/application/ports";

export class PrismaScheduleBlockRepository implements ScheduleBlockRepository {
  constructor(private readonly db: PrismaClient) {}

  list({ from, to, barberProfileId }: PeriodFilter) {
    return this.db.scheduleBlock.findMany({
      where: { barberProfileId, startsAt: { lt: to }, endsAt: { gt: from } },
      orderBy: { startsAt: "asc" },
    });
  }

  findById(id: string) {
    return this.db.scheduleBlock.findUnique({ where: { id } });
  }

  async create(data: NewScheduleBlock) {
    const row = await this.db.scheduleBlock.create({ data, select: { id: true } });
    return row.id;
  }

  async delete(id: string) {
    await this.db.scheduleBlock.delete({ where: { id } });
  }
}
