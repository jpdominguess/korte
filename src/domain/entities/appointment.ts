import { DomainError, forbidden } from "../shared/errors";
import type { Subscription } from "./subscription";
import type { User } from "./user";

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

const CLIENT_CANCEL_WINDOW_MS = 2 * 60 * 60 * 1000;

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

  /** RN05: o cliente cancela até 2 horas antes do horário marcado. */
  static clientCanCancel(startsAt: Date, now: Date): boolean {
    return startsAt.getTime() - now.getTime() >= CLIENT_CANCEL_WINDOW_MS;
  }

  cancel(by: User, now: Date): void {
    this.assertScheduled();
    if (by.isClient()) {
      if (this.clientId !== by.id) throw forbidden();
      if (!Appointment.clientCanCancel(this.startsAt, now)) {
        throw new DomainError("O cancelamento pelo site é permitido até 2 horas antes do horário.");
      }
    } else if (!by.canManage(this)) {
      throw forbidden();
    }
    this.currentStatus = "CANCELADO";
  }

  complete(): void {
    this.assertScheduled();
    this.currentStatus = "CONCLUIDO";
  }

  /** RN07: serviço coberto sai por R$ 0,00 e consome um uso da assinatura. */
  completeWithSubscription(subscription: Subscription, today: string): void {
    this.assertScheduled();
    if (subscription.clientId !== this.clientId) throw new DomainError("A assinatura não é deste cliente.");
    subscription.consumeUse(today);
    this.currentStatus = "CONCLUIDO";
  }

  /** RN04: a falta só pode ser registrada depois do horário marcado. */
  markNoShow(now: Date): void {
    this.assertScheduled();
    if (now < this.startsAt) throw new DomainError("A falta só pode ser registrada depois do horário do atendimento.");
    this.currentStatus = "FALTOU";
  }

  private assertScheduled(): void {
    if (this.currentStatus !== "AGENDADO") throw new DomainError("Este agendamento já foi encerrado.", "conflict");
  }
}
