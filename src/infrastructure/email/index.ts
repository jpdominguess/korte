import type { EmailSender } from "@/application/ports";
import { BrevoEmailAdapter } from "./brevo-email-adapter";
import { ConsoleEmailSender } from "./console-email-sender";

const apiKey = process.env.BREVO_API_KEY;

export const emailSender: EmailSender = apiKey
  ? new BrevoEmailAdapter(apiKey, process.env.EMAIL_FROM ?? "nao-responda@korte.app")
  : new ConsoleEmailSender();
