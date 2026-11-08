import type { Metadata } from "next";
import { toLocalDate } from "@/domain/shared/time";
import { useCases } from "@/infrastructure/container";
import { Card, EmptyState, PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";
import { getManagedBarbers } from "../managed-barbers";
import { WalkInForm } from "./walk-in-form";

export const metadata: Metadata = { title: "Novo agendamento" };

export default async function NovoAgendamentoPage() {
  const { user } = await requireSession(["OWNER", "BARBER"]);
  const [barbers, services, clients] = await Promise.all([
    getManagedBarbers(user),
    useCases.listServices.execute({ onlyActive: true }),
    useCases.listClients.execute(user),
  ]);

  return (
    <>
      <PageHeader title="Novo agendamento" subtitle="Registre um atendimento presencial ou um encaixe." />
      {barbers.length === 0 ? (
        <Card>
          <EmptyState title="Nenhum barbeiro ativo" text="Cadastre ou ative um barbeiro para registrar agendamentos." />
        </Card>
      ) : (
        <WalkInForm
          barbers={barbers}
          services={services}
          clients={clients}
          initialBarberId={barbers.length === 1 ? barbers[0].id : ""}
          today={toLocalDate(new Date())}
          backHref={user.isOwner() ? "/painel/agenda" : "/agenda"}
        />
      )}
    </>
  );
}
