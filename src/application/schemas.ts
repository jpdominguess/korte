import { z } from "zod";

z.config(z.locales.pt());

const optionalText = z
  .string()
  .trim()
  .max(200)
  .nullish()
  .transform((value) => value || null);

const uuids = z.array(z.uuid()).default([]);

export const serviceSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do serviço.").max(80),
  description: optionalText,
  durationMin: z.coerce.number().int("A duração deve ser em minutos inteiros.").positive("Informe a duração."),
  price: z.coerce.number().min(0, "O preço não pode ser negativo."),
  active: z.boolean().default(true),
  barberIds: uuids,
});

export const newBarberSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(80),
  email: z.email("Informe um e-mail válido.").max(120),
  phone: optionalText,
  password: z.string().min(8, "A senha inicial precisa ter pelo menos 8 caracteres.").max(128),
  serviceIds: uuids,
});

export const updateBarberSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(80),
  phone: optionalText,
  active: z.boolean(),
  serviceIds: uuids,
});

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe o horário no formato 00:00.");

export const workScheduleSchema = z.object({
  intervals: z
    .array(z.object({ weekday: z.number().int().min(0).max(6), start: time, end: time }))
    .max(28),
});

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const slotsQuerySchema = z.object({
  servico: z.uuid("Serviço inválido."),
  barbeiro: z.uuid("Barbeiro inválido."),
  data: localDate,
});

export const agendaQuerySchema = z.object({
  data: localDate,
  dias: z.coerce.number().int().min(1).max(31).default(1),
  barbeiro: z.uuid().optional(),
});

export const appointmentSchema = z.object({
  serviceId: z.uuid("Escolha um serviço."),
  barberProfileId: z.uuid("Escolha um barbeiro."),
  startsAt: z.coerce.date("Escolha um horário."),
  clientId: z.uuid().nullish(),
  walkInName: optionalText,
  walkInPhone: optionalText,
});

export const paymentMethodSchema = z.enum(["CASH", "PIX", "DEBIT", "CREDIT"], "Escolha a forma de pagamento.");

export const completeSchema = z.object({
  amount: z.coerce.number("Informe o valor.").min(0, "O valor não pode ser negativo."),
  method: paymentMethodSchema,
});

const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Informe data e hora.");

export const blockSchema = z.object({
  barberProfileId: z.uuid("Escolha um barbeiro."),
  startsAt: localDateTime,
  endsAt: localDateTime,
  reason: optionalText,
});

export const barbershopSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da barbearia.").max(80),
  cep: optionalText,
  street: optionalText,
  number: optionalText,
  city: optionalText,
  phone: optionalText,
  whatsapp: optionalText,
  logoUrl: z
    .union([z.literal(""), z.url({ protocol: /^https?$/, error: "Informe um endereço de imagem válido." })])
    .nullish()
    .transform((value) => value || null),
});
