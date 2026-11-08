export type AppointmentStatus = "AGENDADO" | "CONCLUIDO" | "CANCELADO" | "FALTOU";

export interface AppointmentProps {
  id: string;
  barberProfileId: string;
  serviceId: string;
  clientId: string | null;
  walkInName: string | null;
  walkInPhone: string | null;
  startsAt: Date;
  endsAt: Date;
  status: AppointmentStatus;
}

export class Appointment {
  readonly id: string;
  readonly barberProfileId: string;
  readonly serviceId: string;
  readonly clientId: string | null;
  readonly startsAt: Date;
  readonly endsAt: Date;
  private currentStatus: AppointmentStatus;

  constructor(props: AppointmentProps) {
    this.id = props.id;
    this.barberProfileId = props.barberProfileId;
    this.serviceId = props.serviceId;
    this.clientId = props.clientId;
    this.startsAt = props.startsAt;
    this.endsAt = props.endsAt;
    this.currentStatus = props.status;
  }

  get status(): AppointmentStatus {
    return this.currentStatus;
  }
}
