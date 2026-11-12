import { WorkSchedule, type WorkInterval } from "@/domain/entities/work-schedule";
import { DomainError, notFound } from "@/domain/shared/errors";
import { minutesOfDay, toLocalDate, weekdayOf } from "@/domain/shared/time";
import type { User } from "@/domain/entities/user";
import type { UnitOfWork, WorkScheduleRepository } from "../ports";

/** O agendamento cabe inteiro dentro de algum período do expediente daquele dia da semana. */
function fits(intervals: WorkInterval[], startsAt: Date, endsAt: Date) {
  const day = toLocalDate(startsAt);
  const start = minutesOfDay(startsAt);
  const end = toLocalDate(endsAt) === day ? minutesOfDay(endsAt) : 24 * 60;
  return intervals.some((i) => i.weekday === weekdayOf(day) && i.startMin <= start && end <= i.endMin);
}

export class GetWorkSchedule {
  constructor(private readonly workSchedules: WorkScheduleRepository) {}

  execute(actor: User, barberProfileId: string) {
    actor.assertOwner();
    return this.workSchedules.listForBarber(barberProfileId);
  }
}

export class SetWorkSchedule {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /** Clientes marcados fora do novo expediente são listados; só são cancelados se o dono pedir. */
  async execute(actor: User, barberProfileId: string, intervals: WorkInterval[], options: { cancelConflicts?: boolean } = {}, now = new Date()) {
    actor.assertOwner();
    const schedule = new WorkSchedule(intervals);
    await this.unitOfWork.run(async ({ barbers, workSchedules, appointments }) => {
      if (!(await barbers.findById(barberProfileId))) throw notFound("Barbeiro");
      const upcoming = await appointments.listScheduledFrom(barberProfileId, now);
      const conflicts = upcoming.filter((a) => !fits(schedule.intervals, a.startsAt, a.endsAt));
      if (conflicts.length > 0 && !options.cancelConflicts) {
        throw new DomainError(
          conflicts.length === 1 ? "1 cliente marcado ficaria fora do novo expediente." : `${conflicts.length} clientes marcados ficariam fora do novo expediente.`,
          "conflict",
          { conflicts: conflicts.map((a) => ({ id: a.id, startsAt: a.startsAt, clientName: a.clientName, serviceName: a.serviceName })) },
        );
      }

      for (const conflict of conflicts) {
        const appointment = await appointments.findById(conflict.id);
        if (!appointment || appointment.status !== "AGENDADO") continue;
        appointment.cancel(actor, now);
        await appointments.saveStatus(appointment);
      }
      await workSchedules.replace(barberProfileId, schedule.intervals);
    });
  }
}
