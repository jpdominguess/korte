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

/** Foto já reduzida no navegador; SVG fica de fora porque pode carregar script. */
const photo = z
  .string()
  .max(400_000, "A foto ficou grande demais.")
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/, "Envie uma foto em JPG, PNG ou WebP.");

const teamRole = z.enum(["BARBER", "OWNER"], { error: "Escolha o cargo." });

export const newBarberSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(80),
  email: z.email("Informe um e-mail válido.").max(120),
  phone: optionalText,
  password: z.string().min(8, "A senha inicial precisa ter pelo menos 8 caracteres.").max(128),
  serviceIds: uuids,
  photo: photo.nullish(),
  role: teamRole.default("BARBER"),
});

export const updateBarberSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(80),
  email: z.email("Informe um e-mail válido.").max(120).optional(),
  phone: optionalText,
  active: z.boolean(),
  serviceIds: uuids,
  photo: photo.nullish(),
  role: teamRole.optional(),
});

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe o horário no formato 00:00.");

export const workScheduleSchema = z.object({
  intervals: z
    .array(z.object({ weekday: z.number().int().min(0).max(6), start: time, end: time }))
    .max(28),
  /** Confirma o cancelamento dos clientes que ficariam fora do novo expediente. */
  cancelConflicts: z.boolean().optional(),
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

const amount = z.coerce.number("Informe o valor.").min(0, "O valor não pode ser negativo.");

export const completeSchema = z.object({
  useSubscription: z.boolean().default(false),
  amount: amount.optional(),
  method: paymentMethodSchema.optional(),
});

export const planSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do plano.").max(80),
  price: z.coerce.number().min(0, "O preço não pode ser negativo."),
  usesPerCycle: z.coerce.number().int("Informe um número inteiro de usos.").positive("Informe quantos usos o plano dá por ciclo."),
  active: z.boolean().default(true),
  serviceIds: z.array(z.uuid()).min(1, "Escolha ao menos um serviço incluído."),
});

export const activateSubscriptionSchema = z.object({
  clientId: z.uuid("Escolha o cliente."),
  planId: z.uuid("Escolha o plano."),
  amount,
  method: paymentMethodSchema,
});

export const subscriptionActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("renovar"), amount, method: paymentMethodSchema }),
  z.object({ action: z.literal("cancelar") }),
]);

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
