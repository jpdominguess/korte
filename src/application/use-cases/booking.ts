import { BarberProfile } from "@/domain/entities/barber-profile";
import type { User } from "@/domain/entities/user";
import { AvailabilityCalculator } from "@/domain/services/availability-calculator";
import { DomainError } from "@/domain/shared/errors";
import { addDays, localToInstant, toLocalDate } from "@/domain/shared/time";
import type { AppointmentRepository, BarberRepository, ScheduleBlockRepository, ServiceRepository, WorkScheduleRepository } from "../ports";

const slotTaken = () => new DomainError("Esse horário acabou de ser ocupado. Escolha outro.", "conflict");

export class GetAvailableSlots {
  private readonly calculator = new AvailabilityCalculator();

  constructor(
    private readonly services: ServiceRepository,
    private readonly barbers: BarberRepository,
    private readonly workSchedules: WorkScheduleRepository,
    private readonly blocks: ScheduleBlockRepository,
    private readonly appointments: AppointmentRepository,
  ) {}

  async execute(input: { serviceId: string; barberProfileId: string; date: string }, now = new Date()): Promise<Date[]> {
    const [service, barber] = await Promise.all([
      this.services.findById(input.serviceId),
      this.barbers.findById(input.barberProfileId),
    ]);
    if (!service?.active || !barber) return [];
    if (!new BarberProfile(barber.id, barber.active, barber.serviceIds).canAttend(service.id)) return [];

    const from = localToInstant(input.date, 0);
    const to = localToInstant(addDays(input.date, 1), 0);
    const [workIntervals, blocks, appointments] = await Promise.all([
      this.workSchedules.listForBarber(barber.id),
      this.blocks.list({ barberProfileId: barber.id, from, to }),
      this.appointments.listBusyRanges(barber.id, from, to),
    ]);

    return this.calculator.slots({
      date: input.date,
      workIntervals,
      busy: [...appointments, ...blocks.map((b) => ({ start: b.startsAt, end: b.endsAt }))],
      durationMin: service.durationMin,
      now,
    });
  }
}

export interface CreateAppointmentInput {
  serviceId: string;
  barberProfileId: string;
  startsAt: Date;
}

export class CreateAppointment {
  constructor(
    private readonly services: ServiceRepository,
    private readonly availableSlots: GetAvailableSlots,
    private readonly appointments: AppointmentRepository,
  ) {}

  async execute(actor: User, input: CreateAppointmentInput) {
    actor.assertClient();

    const service = await this.services.findById(input.serviceId);
    if (!service?.active) throw new DomainError("Serviço indisponível.");

    const slots = await this.availableSlots.execute({
      serviceId: input.serviceId,
      barberProfileId: input.barberProfileId,
      date: toLocalDate(input.startsAt),
    });
    if (!slots.some((slot) => slot.getTime() === input.startsAt.getTime())) throw slotTaken();

    return this.appointments.create({
      barberProfileId: input.barberProfileId,
      serviceId: input.serviceId,
      clientId: actor.id,
      walkInName: null,
      walkInPhone: null,
      startsAt: input.startsAt,
      endsAt: new Date(input.startsAt.getTime() + service.durationMin * 60_000),
    });
  }
}
