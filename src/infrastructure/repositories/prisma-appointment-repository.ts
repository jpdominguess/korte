import type { Prisma, PrismaClient } from "@prisma/client";
import type { AppointmentDTO } from "@/application/dto";
import type { AppointmentRepository, NewAppointment, PeriodFilter } from "@/application/ports";
import { Appointment, type AppointmentStatus } from "@/domain/entities/appointment";
import { DomainError } from "@/domain/shared/errors";

const include = {
  service: true,
  client: true,
  barberProfile: { include: { user: true } },
} satisfies Prisma.AppointmentInclude;

type Row = Prisma.AppointmentGetPayload<{ include: typeof include }>;

function toDTO(row: Row): AppointmentDTO {
  return {
    id: row.id,
    barberProfileId: row.barberProfileId,
    barberName: row.barberProfile.user.name,
    serviceId: row.serviceId,
    serviceName: row.service.name,
    servicePrice: row.service.price.toNumber(),
    durationMin: Math.round((row.endsAt.getTime() - row.startsAt.getTime()) / 60_000),
    clientId: row.clientId,
    clientName: row.client?.name ?? row.walkInName ?? "Cliente",
    clientPhone: row.client?.phone ?? row.walkInPhone,
    clientEmail: row.client?.email ?? null,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    status: row.status as AppointmentStatus,
  };
}

export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string) {
    const row = await this.db.appointment.findUnique({ where: { id } });
    return row && new Appointment({ ...row, status: row.status as AppointmentStatus });
  }

  async listByClient(clientId: string) {
    const rows = await this.db.appointment.findMany({ where: { clientId }, include, orderBy: { startsAt: "desc" } });
    return rows.map(toDTO);
  }

  async saveStatus(appointment: Appointment) {
    const { count } = await this.db.appointment.updateMany({
      where: { id: appointment.id, status: "AGENDADO" },
      data: { status: appointment.status },
    });
    if (count === 0) throw new DomainError("Este agendamento já foi atualizado.", "conflict");
  }

  async findDetails(id: string) {
    const row = await this.db.appointment.findUnique({ where: { id }, include });
    return row && toDTO(row);
  }

  async list({ from, to, barberProfileId }: PeriodFilter) {
    const rows = await this.db.appointment.findMany({
      where: { barberProfileId, startsAt: { gte: from, lt: to } },
      include,
      orderBy: { startsAt: "asc" },
    });
    return rows.map(toDTO);
  }

  async listBusyRanges(barberProfileId: string, from: Date, to: Date) {
    const rows = await this.db.appointment.findMany({
      where: { barberProfileId, status: "AGENDADO", startsAt: { lt: to }, endsAt: { gt: from } },
      select: { startsAt: true, endsAt: true },
    });
    return rows.map((row) => ({ start: row.startsAt, end: row.endsAt }));
  }

  async create(data: NewAppointment) {
    try {
      const row = await this.db.appointment.create({ data, select: { id: true } });
      return row.id;
    } catch (error) {
      if ((error as Error).message.includes("appointment_no_overlap")) {
        throw new DomainError("Esse horário acabou de ser ocupado. Escolha outro.", "conflict");
      }
      throw error;
    }
  }
}
