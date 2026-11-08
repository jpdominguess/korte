import type { EmailMessage, EmailSender } from "@/application/ports";

export class BrevoEmailAdapter implements EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": this.apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        sender: { email: this.from, name: "Korte" },
        to: [message.to],
        subject: message.subject,
        htmlContent: message.html,
      }),
    });
    if (!response.ok) throw new Error(`Brevo respondeu ${response.status}`);
  }
}
