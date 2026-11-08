import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Scissors } from "lucide-react";
import { DomainError } from "@/domain/shared/errors";
import { formatBRL, formatShortDate, formatTime } from "@/domain/shared/format";
import { useCases } from "@/infrastructure/container";
import { Avatar, Card, LinkButton, Notice, PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";
import { CompleteForm } from "./complete-form";

export const metadata: Metadata = { title: "Concluir atendimento" };

export default async function ConcluirPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireSession(["OWNER", "BARBER"]);
  const { id } = await params;
  const a = await useCases.getAppointmentDetails.execute(user, id).catch((error) => {
    if (error instanceof DomainError) notFound();
    throw error;
  });
  const coverage = a.status === "AGENDADO" ? await useCases.getSubscriptionCoverage.execute(user, a) : null;
  const backHref = user.isOwner() ? `/painel/agenda?barbeiro=${a.barberProfileId}` : "/agenda";

  return (
    <>
      <PageHeader
        title="Concluir atendimento"
        subtitle={`${a.barberName} · ${formatShortDate(a.startsAt)} · ${formatTime(a.startsAt)} às ${formatTime(a.endsAt)}`}
      />
      <Card className="grid max-w-3xl gap-6 p-4 lg:grid-cols-2 lg:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={a.clientName} />
            <div className="min-w-0">
              <p className="truncate font-bold">{a.clientName}</p>
              <p className="truncate text-sm text-texto-2">{a.clientPhone ?? "Sem telefone"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-controle border border-borda px-3 py-3">
            <Scissors className="size-5 shrink-0 text-texto-2" aria-hidden="true" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="font-semibold">{a.serviceName}</p>
              <p className="text-sm text-texto-2">{a.durationMin} min</p>
            </div>
            <span className="num font-bold">{formatBRL(a.servicePrice)}</span>
          </div>
        </div>

        <div>
          {a.status === "AGENDADO" ? (
            <CompleteForm appointmentId={a.id} price={a.servicePrice} backHref={backHref} coverage={coverage} />
          ) : (
            <div className="flex flex-col items-start gap-3">
              <Notice tone="neutral">Este agendamento já foi encerrado.</Notice>
              <LinkButton href={backHref} variant="secondary">
                Voltar
              </LinkButton>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
