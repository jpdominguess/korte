import type { WorkInterval } from "../entities/work-schedule";
import { localToInstant, weekdayOf } from "../shared/time";

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface AvailabilityInput {
  date: string;
  workIntervals: WorkInterval[];
  busy: TimeRange[];
  durationMin: number;
  now: Date;
}

/** RN02: horários de início livres, em grade fixa, para um barbeiro em um dia. */
export class AvailabilityCalculator {
  static readonly GRID_MINUTES = 10;

  slots({ date, workIntervals, busy, durationMin, now }: AvailabilityInput): Date[] {
    const grid = AvailabilityCalculator.GRID_MINUTES;
    const weekday = weekdayOf(date);
    const result: Date[] = [];

    for (const interval of workIntervals.filter((i) => i.weekday === weekday)) {
      const firstMinute = Math.ceil(interval.startMin / grid) * grid;
      for (let minute = firstMinute; minute + durationMin <= interval.endMin; minute += grid) {
        const start = localToInstant(date, minute);
        const end = new Date(start.getTime() + durationMin * 60_000);
        const free = !busy.some((range) => range.start < end && start < range.end);
        if (start > now && free) result.push(start);
      }
    }
    return result;
  }
}
