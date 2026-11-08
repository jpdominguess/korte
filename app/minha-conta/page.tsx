import type { Metadata } from "next";
import { CalendarPlus } from "lucide-react";
import { Appointment } from "@/domain/entities/appointment";
import { formatShortDate, formatTime } from "@/domain/shared/format";
import { useCases } from "@/infrastructure/container";
import { statusInfo } from "~/_components/agenda-list";
import { ConfirmButton } from "~/_components/confirm-button";
import { Badge, Card, EmptyState, LinkButton, PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";

export const metadata: Metadata = { title: "Minha conta" };

export default async function MinhaContaPage() {
  const { user, name } = await requireSession(["CLIENT"]);
  const now = new Date();
  const appointments = await useCases.listClientAppointments.execute(user);

  const upcoming = appointments.filter((a) => a.status === "AGENDADO" && a.endsAt > now).reverse();
  const history = appointments.filter((a) => a.status !== "AGENDADO" || a.endsAt <= now);

  return (
    <>
      <PageHeader
        title={`Olá, ${name.split(" ")[0]}`}
        subtitle="Seus horários e atendimentos."
        actions={
          <LinkButton href="/agendar">
            <CalendarPlus />
            Agendar horário
          </LinkButton>
        }
      />

      <h2 className="mb-2 font-bold">Próximos agendamentos</h2>
      <Card className="mb-6">
        {upcoming.length === 0 ? (
          <EmptyState title="Nenhum horário marcado" text="Escolha um serviço e um horário que combine com você." />
        ) : (
          <ul>
            {upcoming.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-borda px-4 py-3 last:border-b-0">
                <div className="min-w-0">
                  <p className="num font-semibold">
                    {formatShortDate(a.startsAt)} às {formatTime(a.startsAt)}
                  </p>
                  <p className="text-sm text-texto-2">
                    {a.serviceName} com {a.barberName}
                  </p>
                </div>
                {Appointment.clientCanCancel(a.startsAt, now) ? (
                  <ConfirmButton url={`/api/agendamentos/${a.id}/cancelar`} label="Cancelar" confirmLabel="Confirmar cancelamento" />
                ) : (
                  <span className="text-xs text-texto-2">Cancelamento só até 2 h antes</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <h2 className="mb-2 font-bold">Histórico</h2>
      <Card>
        {history.length === 0 ? (
          <EmptyState title="Nenhum atendimento ainda" />
        ) : (
          <ul>
            {history.map((a) => {
              const info = a.status === "AGENDADO" ? { label: "Aguardando registro", tone: "neutral" as const } : statusInfo[a.status];
              return (
                <li key={a.id} className="flex items-center justify-between gap-4 border-b border-borda px-4 py-3 last:border-b-0">
                  <div className="min-w-0">
                    <p className="num font-semibold">
                      {formatShortDate(a.startsAt)} às {formatTime(a.startsAt)}
                    </p>
                    <p className="truncate text-sm text-texto-2">
                      {a.serviceName} com {a.barberName}
                    </p>
                  </div>
                  <Badge tone={info.tone}>{info.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
