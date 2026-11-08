import type { Metadata } from "next";
import Link from "next/link";
import { formatLongDate } from "@/domain/shared/format";
import { localToInstant } from "@/domain/shared/time";
import { useCases } from "@/infrastructure/container";
import { AgendaList } from "~/_components/agenda-list";
import { AgendaToolbar, readAgendaParams } from "~/_components/agenda-toolbar";
import { AgendaWeek } from "~/_components/agenda-week";
import { Card, EmptyState, PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";
import { AgendaGrid } from "./agenda-grid";

export const metadata: Metadata = { title: "Agenda geral" };

export default async function AgendaGeralPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; vista?: string; barbeiro?: string }>;
}) {
  const { user } = await requireSession(["OWNER"]);
  const params = await searchParams;
  const now = new Date();
  const allBarbers = await useCases.listBarbers.execute(user);
  const selected = allBarbers.find((b) => b.id === params.barbeiro) ?? null;

  const agendaParams = readAgendaParams(params, now);
  const view = selected ? agendaParams.view : "dia";
  const { date, start } = agendaParams;
  const { from, to } = view === agendaParams.view ? agendaParams : readAgendaParams({ data: date, vista: "dia" }, now);

  const agenda = await useCases.getAgenda.execute(user, { from, to, barberProfileId: selected?.id });
  const barbers = allBarbers.filter((b) => b.active || agenda.appointments.some((a) => a.barberProfileId === b.id));
  const counts = {
    total: agenda.appointments.length,
    done: agenda.appointments.filter((a) => a.status === "CONCLUIDO").length,
    scheduled: agenda.appointments.filter((a) => a.status === "AGENDADO").length,
  };
  const chipClass = (active: boolean) =>
    `inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-sm font-semibold no-underline ${active ? "border-marinho bg-marinho text-white" : "border-borda-controle bg-superficie text-marinho hover:bg-muted"}`;

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle={`${view === "dia" ? formatLongDate(localToInstant(date, 12 * 60)) : "Semana"} · ${counts.total} agendamentos · ${counts.done} concluídos · ${counts.scheduled} agendados`}
        actions={
          <AgendaToolbar
            basePath="/painel/agenda"
            date={date}
            view={view}
            allowWeek={!!selected}
            extraQuery={selected ? `&barbeiro=${selected.id}` : ""}
          />
        }
      />

      <nav aria-label="Filtrar por barbeiro" className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <Link href={`/painel/agenda?data=${date}`} aria-current={!selected ? "true" : undefined} className={chipClass(!selected)}>
          Todos
        </Link>
        {allBarbers.map((barber) => (
          <Link
            key={barber.id}
            href={`/painel/agenda?data=${date}&vista=${agendaParams.view}&barbeiro=${barber.id}`}
            aria-current={selected?.id === barber.id ? "true" : undefined}
            className={chipClass(selected?.id === barber.id)}
          >
            {barber.name}
          </Link>
        ))}
      </nav>

      {barbers.length === 0 ? (
        <Card>
          <EmptyState title="Nenhum barbeiro cadastrado" text="Cadastre a equipe para abrir a agenda." />
        </Card>
      ) : !selected ? (
        <AgendaGrid agenda={agenda} barbers={barbers} date={date} now={now} />
      ) : view === "semana" ? (
        <AgendaWeek start={start} appointments={agenda.appointments} blocks={agenda.blocks} now={now} />
      ) : (
        <Card>
          {agenda.appointments.length + agenda.blocks.length === 0 ? (
            <EmptyState title="Nenhum agendamento neste dia" />
          ) : (
            <AgendaList appointments={agenda.appointments} blocks={agenda.blocks} now={now} />
          )}
        </Card>
      )}
    </>
  );
}
