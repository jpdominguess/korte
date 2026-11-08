import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { useCases } from "@/infrastructure/container";
import { PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";
import { ServiceForm } from "../service-form";

export const metadata: Metadata = { title: "Editar serviço" };

export default async function EditarServicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireSession(["OWNER"]);
  const { id } = await params;
  const [services, barbers] = await Promise.all([useCases.listServices.execute(), useCases.listBarbers.execute(user)]);
  const service = services.find((s) => s.id === id);
  if (!service) notFound();

  return (
    <>
      <PageHeader title={service.name} />
      <ServiceForm service={service} barbers={barbers} />
    </>
  );
}
