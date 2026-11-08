import type { PrismaClient } from "@prisma/client";
import type { PeriodFilter, ScheduleBlockRepository } from "@/application/ports";

export class PrismaScheduleBlockRepository implements ScheduleBlockRepository {
  constructor(private readonly db: PrismaClient) {}

  list({ from, to, barberProfileId }: PeriodFilter) {
    return this.db.scheduleBlock.findMany({
      where: { barberProfileId, startsAt: { lt: to }, endsAt: { gt: from } },
      orderBy: { startsAt: "asc" },
    });
  }
}
