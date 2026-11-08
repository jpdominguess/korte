import type { Metadata } from "next";
import { useCases } from "@/infrastructure/container";
import { EmptyState, PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";
import { BarbershopForm } from "./barbershop-form";

export const metadata: Metadata = { title: "Barbearia" };

export default async function BarbeariaPage() {
  await requireSession(["OWNER"]);
  const shop = await useCases.getBarbershop.execute();

  return (
    <>
      <PageHeader title="Barbearia" subtitle="Informações exibidas na página pública." />
      {shop ? <BarbershopForm shop={shop} /> : <EmptyState title="Barbearia não configurada" text="Rode o seed do banco para criá-la." />}
    </>
  );
}
