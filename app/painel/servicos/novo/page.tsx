import type { Metadata } from "next";
import { useCases } from "@/infrastructure/container";
import { PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";
import { ServiceForm } from "../service-form";

export const metadata: Metadata = { title: "Novo serviço" };

export default async function NovoServicoPage() {
  const { user } = await requireSession(["OWNER"]);
  const barbers = await useCases.listBarbers.execute(user);

  return (
    <>
      <PageHeader title="Novo serviço" />
      <ServiceForm barbers={barbers} />
    </>
  );
}
