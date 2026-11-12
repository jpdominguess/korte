import type { Metadata } from "next";
import { isLocalDate, toLocalDate } from "@/domain/shared/time";
import { useCases } from "@/infrastructure/container";
import { Card, EmptyState, PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";
import { getManagedBarbers } from "../managed-barbers";
import { WalkInForm } from "./walk-in-form";

export const metadata: Metadata = { title: "Novo agendamento" };

export default async function NovoAgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ barbeiro?: string; data?: string; hora?: string }>;
}) {
  const { user } = await requireSession(["OWNER", "BARBER"]);
  const { barbeiro, data, hora } = await searchParams;
  const [barbers, services, clients] = await Promise.all([
    getManagedBarbers(user),
    useCases.listServices.execute({ onlyActive: true }),
    useCases.listClients.execute(user),
  ]);
  // Vindo de um clique na agenda: barbeiro, dia e hora chegam já escolhidos.
  const today = toLocalDate(new Date());
  const initialBarberId = barbers.find((b) => b.id === barbeiro)?.id ?? (barbers.length === 1 ? barbers[0].id : "");
  const initialDate = isLocalDate(data) && data >= today ? data : today;
  const desiredTime = hora && /^([01]\d|2[0-3]):[0-5]\d$/.test(hora) ? hora : null;
  const agendaPath = user.isOwner() ? "/painel/agenda" : "/agenda";

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
          initialBarberId={initialBarberId}
          initialDate={initialDate}
          desiredTime={desiredTime}
          today={today}
          backHref={`${agendaPath}?data=${initialDate}`}
        />
      )}
    </>
  );
}
