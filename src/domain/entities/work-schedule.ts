import { DomainError } from "../shared/errors";

export interface WorkInterval {
  weekday: number;
  startMin: number;
  endMin: number;
}

export class WorkSchedule {
  readonly intervals: WorkInterval[];

  constructor(intervals: WorkInterval[]) {
    const sorted = [...intervals].sort((a, b) => a.weekday - b.weekday || a.startMin - b.startMin);
    sorted.forEach((interval, index) => {
      if (interval.weekday < 0 || interval.weekday > 6) throw new DomainError("Dia da semana inválido.");
      if (interval.startMin >= interval.endMin) throw new DomainError("O fim do expediente deve ser depois do início.");
      const previous = sorted[index - 1];
      if (previous?.weekday === interval.weekday && interval.startMin < previous.endMin) {
        throw new DomainError("Os períodos de um mesmo dia não podem se sobrepor.");
      }
    });
    this.intervals = sorted;
  }
}
