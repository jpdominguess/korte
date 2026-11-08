import type { Metadata } from "next";
import { useCases } from "@/infrastructure/container";
import { PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";
import { BarberForm } from "../barber-form";

export const metadata: Metadata = { title: "Novo barbeiro" };

export default async function NovoBarbeiroPage() {
  await requireSession(["OWNER"]);
  const services = await useCases.listServices.execute({ onlyActive: true });

  return (
    <>
      <PageHeader title="Novo barbeiro" />
      <BarberForm services={services} />
    </>
  );
}
