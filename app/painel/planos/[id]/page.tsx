import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { useCases } from "@/infrastructure/container";
import { PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";
import { PlanForm } from "../plan-form";

export const metadata: Metadata = { title: "Editar plano" };

export default async function EditarPlanoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession(["OWNER"]);
  const { id } = await params;
  const [plans, services] = await Promise.all([useCases.listPlans.execute(), useCases.listServices.execute({ onlyActive: true })]);
  const plan = plans.find((p) => p.id === id);
  if (!plan) notFound();

  return (
    <>
      <PageHeader title={plan.name} subtitle="Alterações valem a partir da próxima renovação de cada assinante." />
      <PlanForm plan={plan} services={services} />
    </>
  );
}
