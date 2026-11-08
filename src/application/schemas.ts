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
