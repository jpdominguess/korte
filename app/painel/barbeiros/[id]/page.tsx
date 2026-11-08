import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { useCases } from "@/infrastructure/container";
import { PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";
import { BarberForm } from "../barber-form";

export const metadata: Metadata = { title: "Editar barbeiro" };

export default async function EditarBarbeiroPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireSession(["OWNER"]);
  const { id } = await params;
  const [barbers, services] = await Promise.all([
    useCases.listBarbers.execute(user),
    useCases.listServices.execute({ onlyActive: true }),
  ]);
  const barber = barbers.find((b) => b.id === id);
  if (!barber) notFound();

  return (
    <>
      <PageHeader title={barber.name} subtitle="Dados, serviços e situação do barbeiro." />
      <BarberForm barber={barber} services={services} />
    </>
  );
}
