"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { barbershopSchema } from "@/application/schemas";
import { DomainError } from "@/domain/shared/errors";
import { useCases } from "@/infrastructure/container";
import { requireSession } from "~/_lib/session";

export async function buscarCep(cep: string): Promise<{ street?: string; city?: string; error?: string }> {
  const { user } = await requireSession(["OWNER"]);
  try {
    const address = await useCases.lookupAddress.execute(user, cep);
    return address ?? { error: "CEP não encontrado." };
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message };
    return { error: "Não foi possível consultar o CEP agora. Preencha o endereço manualmente." };
  }
}

export async function salvarBarbearia(input: unknown): Promise<{ error?: string }> {
  const { user } = await requireSession(["OWNER"]);
  try {
    await useCases.updateBarbershop.execute(user, barbershopSchema.parse(input));
    revalidatePath("/", "layout");
    return {};
  } catch (error) {
    if (error instanceof ZodError) return { error: error.issues[0]?.message };
    if (error instanceof DomainError) return { error: error.message };
    console.error(error);
    return { error: "Não foi possível salvar. Tente novamente." };
  }
}
