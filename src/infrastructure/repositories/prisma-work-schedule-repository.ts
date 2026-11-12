import type { Database } from "../prisma/client";
import type { WorkScheduleRepository } from "@/application/ports";
import type { WorkInterval } from "@/domain/entities/work-schedule";

const toMinutes = (time: Date) => time.getUTCHours() * 60 + time.getUTCMinutes();
const toTime = (minutes: number) => new Date(Date.UTC(1970, 0, 1, 0, minutes));

interface Row {
  barberProfileId: string;
  weekday: number;
  startTime: Date;
  endTime: Date;
}

function toInterval(row: Row) {
  return {
    barberProfileId: row.barberProfileId,
    weekday: row.weekday,
    startMin: toMinutes(row.startTime),
    endMin: toMinutes(row.endTime),
  };
}

export class PrismaWorkScheduleRepository implements WorkScheduleRepository {
  constructor(private readonly db: Database) {}

  async listForBarber(barberProfileId: string) {
    const rows = await this.db.workSchedule.findMany({
      where: { barberProfileId },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });
    return rows.map(toInterval);
  }

  async listAll() {
    const rows = await this.db.workSchedule.findMany({ orderBy: [{ weekday: "asc" }, { startTime: "asc" }] });
    return rows.map(toInterval);
  }

  async replace(barberProfileId: string, intervals: WorkInterval[]) {
    const replace = async (db: Database) => {
      await db.workSchedule.deleteMany({ where: { barberProfileId } });
      await db.workSchedule.createMany({
        data: intervals.map((interval) => ({
          barberProfileId,
          weekday: interval.weekday,
          startTime: toTime(interval.startMin),
          endTime: toTime(interval.endMin),
        })),
      });
    };
    if ("$transaction" in this.db) await this.db.$transaction(replace);
    else await replace(this.db);
  }
}
