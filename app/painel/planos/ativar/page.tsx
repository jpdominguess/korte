import type { Metadata } from "next";
import { useCases } from "@/infrastructure/container";
import { PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";
import { ActivateForm } from "./activate-form";

export const metadata: Metadata = { title: "Ativar assinatura" };

export default async function AtivarAssinaturaPage() {
  const { user } = await requireSession(["OWNER"]);
  const [clients, plans] = await Promise.all([useCases.listClients.execute(user), useCases.listPlans.execute({ onlyActive: true })]);

  return (
    <>
      <PageHeader title="Ativar assinatura" subtitle="Inicia um ciclo de 30 dias a partir de hoje." />
      <ActivateForm clients={clients} plans={plans} />
    </>
  );
}
