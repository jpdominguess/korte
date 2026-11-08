import { formatLongDate, formatTime } from "@/domain/shared/format";
import type { AppointmentCreated } from "../events";
import type { AppointmentRepository, BarbershopRepository, EmailSender } from "../ports";

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Reage ao AppointmentCreated. Cliente avulso não tem e-mail e não recebe mensagem. */
export class SendAppointmentConfirmation {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly barbershops: BarbershopRepository,
    private readonly email: EmailSender,
  ) {}

  async handle(event: AppointmentCreated) {
    const appointment = await this.appointments.findDetails(event.appointmentId);
    if (!appointment?.clientEmail) return;

    const shop = await this.barbershops.get();
    const when = `${formatLongDate(appointment.startsAt)}, às ${formatTime(appointment.startsAt)}`;

    await this.email.send({
      to: { email: appointment.clientEmail, name: appointment.clientName },
      subject: `Horário confirmado: ${when}`,
      html: [
        `<p>Olá, ${escapeHtml(appointment.clientName)}. Seu horário${shop ? ` na ${escapeHtml(shop.name)}` : ""} está confirmado.</p>`,
        "<ul>",
        `<li><strong>Serviço:</strong> ${escapeHtml(appointment.serviceName)}</li>`,
        `<li><strong>Profissional:</strong> ${escapeHtml(appointment.barberName)}</li>`,
        `<li><strong>Data e horário:</strong> ${when}</li>`,
        "</ul>",
        "<p>Se precisar, você pode cancelar pelo site até 2 horas antes.</p>",
      ].join(""),
    });
  }
}
