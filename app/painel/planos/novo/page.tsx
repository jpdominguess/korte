import type { Metadata } from "next";
import { useCases } from "@/infrastructure/container";
import { PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";
import { PlanForm } from "../plan-form";

export const metadata: Metadata = { title: "Novo plano" };

export default async function NovoPlanoPage() {
  await requireSession(["OWNER"]);
  const services = await useCases.listServices.execute({ onlyActive: true });

  return (
    <>
      <PageHeader title="Novo plano" subtitle="Defina preço, serviços incluídos e usos a cada 30 dias." />
      <PlanForm services={services} />
    </>
  );
}
