import type { EmailMessage, EmailSender } from "@/application/ports";

/** Usado sem chave do Brevo: no desenvolvimento, mostra o e-mail no terminal. */
export class ConsoleEmailSender implements EmailSender {
  async send(message: EmailMessage) {
    if (process.env.NODE_ENV === "production") {
      console.warn("BREVO_API_KEY não configurada: e-mail não enviado.");
      return;
    }
    console.info(`[e-mail] para ${message.to.email}: ${message.subject}\n${message.html}`);
  }
}
