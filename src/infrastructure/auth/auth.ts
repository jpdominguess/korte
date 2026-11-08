import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { emailSender } from "../email";
import { prisma } from "../prisma/client";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      await emailSender.send({
        to: { email: user.email, name: user.name },
        subject: "Redefinir sua senha no Korte",
        html: `<p>Olá, ${escapeHtml(user.name)}.</p><p>Para criar uma nova senha, acesse: <a href="${url}">redefinir senha</a>.</p><p>Se não foi você, ignore este e-mail.</p>`,
      });
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", input: false, defaultValue: "CLIENT" },
      phone: { type: "string", required: false, input: true },
    },
  },
  advanced: { database: { generateId: () => crypto.randomUUID() } },
  plugins: [nextCookies()],
});

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
