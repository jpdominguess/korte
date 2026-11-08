import { forbidden, notFound } from "@/domain/shared/errors";
import type { User } from "@/domain/entities/user";
import type { AgendaDTO } from "../dto";
import type { AppointmentRepository, ScheduleBlockRepository, WorkScheduleRepository } from "../ports";

export class GetAgenda {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly blocks: ScheduleBlockRepository,
    private readonly workSchedules: WorkScheduleRepository,
  ) {}

  /** Dono vê a agenda geral ou a de um profissional; barbeiro, só a própria. */
  async execute(actor: User, filter: { from: Date; to: Date; barberProfileId?: string }): Promise<AgendaDTO> {
    actor.assertStaff();
    const barberProfileId = actor.isOwner() ? filter.barberProfileId : (actor.barberProfileId ?? undefined);
    if (!actor.isOwner() && !barberProfileId) throw forbidden();

    const period = { from: filter.from, to: filter.to, barberProfileId };
    const [appointments, blocks, allIntervals] = await Promise.all([
      this.appointments.list(period),
      this.blocks.list(period),
      this.workSchedules.listAll(),
    ]);
    return {
      appointments,
      blocks,
      workIntervals: barberProfileId ? allIntervals.filter((i) => i.barberProfileId === barberProfileId) : allIntervals,
    };
  }
}

export class GetAppointmentDetails {
  constructor(private readonly appointments: AppointmentRepository) {}

  async execute(actor: User, id: string) {
    const appointment = await this.appointments.findDetails(id);
    if (!appointment) throw notFound("Agendamento");
    if (actor.isClient() ? appointment.clientId !== actor.id : !actor.canManage(appointment)) throw forbidden();
    return appointment;
  }
}
