import { WorkSchedule, type WorkInterval } from "@/domain/entities/work-schedule";
import { DomainError, notFound } from "@/domain/shared/errors";
import { minutesOfDay, toLocalDate, weekdayOf } from "@/domain/shared/time";
import type { User } from "@/domain/entities/user";
import type { AppointmentRepository, BarberRepository, WorkScheduleRepository } from "../ports";

const LOOK_AHEAD_MS = 366 * 24 * 60 * 60_000;

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
  constructor(
    private readonly barbers: BarberRepository,
    private readonly workSchedules: WorkScheduleRepository,
    private readonly appointments: AppointmentRepository,
  ) {}

  /** Clientes marcados fora do novo expediente são listados; só são cancelados se o dono pedir. */
  async execute(actor: User, barberProfileId: string, intervals: WorkInterval[], options: { cancelConflicts?: boolean } = {}, now = new Date()) {
    actor.assertOwner();
    if (!(await this.barbers.findById(barberProfileId))) throw notFound("Barbeiro");
    const schedule = new WorkSchedule(intervals);

    const upcoming = await this.appointments.list({ from: now, to: new Date(now.getTime() + LOOK_AHEAD_MS), barberProfileId });
    const conflicts = upcoming.filter((a) => a.status === "AGENDADO" && !fits(schedule.intervals, a.startsAt, a.endsAt));
    if (conflicts.length > 0 && !options.cancelConflicts) {
      throw new DomainError(
        conflicts.length === 1 ? "1 cliente marcado ficaria fora do novo expediente." : `${conflicts.length} clientes marcados ficariam fora do novo expediente.`,
        "conflict",
        { conflicts: conflicts.map((a) => ({ id: a.id, startsAt: a.startsAt, clientName: a.clientName, serviceName: a.serviceName })) },
      );
    }

    for (const conflict of conflicts) {
      const appointment = await this.appointments.findById(conflict.id);
      if (!appointment || appointment.status !== "AGENDADO") continue;
      appointment.cancel(actor, now);
      await this.appointments.saveStatus(appointment);
    }
    await this.workSchedules.replace(barberProfileId, schedule.intervals);
  }
}
