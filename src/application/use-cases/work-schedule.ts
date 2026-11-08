import { WorkSchedule, type WorkInterval } from "@/domain/entities/work-schedule";
import { notFound } from "@/domain/shared/errors";
import type { User } from "@/domain/entities/user";
import type { BarberRepository, WorkScheduleRepository } from "../ports";

export class GetWorkSchedule {
  constructor(private readonly workSchedules: WorkScheduleRepository) {}

  execute(actor: User, barberProfileId: string) {
    actor.assertOwner();
    return this.workSchedules.listForBarber(barberProfileId);
  }
}

export class SetWorkSchedule {
  constructor(
    private readonly barbers: BarberRepository,
    private readonly workSchedules: WorkScheduleRepository,
  ) {}

  async execute(actor: User, barberProfileId: string, intervals: WorkInterval[]) {
    actor.assertOwner();
    if (!(await this.barbers.findById(barberProfileId))) throw notFound("Barbeiro");
    await this.workSchedules.replace(barberProfileId, new WorkSchedule(intervals).intervals);
  }
}
