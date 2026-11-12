import type { Metadata } from "next";
import { CalendarPlus } from "lucide-react";
import { formatLongDate, formatWeekRange } from "@/domain/shared/format";
import { localToInstant, toLocalDate } from "@/domain/shared/time";
import { useCases } from "@/infrastructure/container";
import { AgendaGrid } from "~/_components/agenda-grid";
import { AgendaToolbar, readAgendaParams } from "~/_components/agenda-toolbar";
import { AgendaWeek } from "~/_components/agenda-week";
import { BarberSelect } from "~/_components/barber-select";
import { Card, EmptyState, LinkButton, PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";

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

  return (
    <>
      <PageHeader
        title={view === "dia" ? formatLongDate(localToInstant(date, 12 * 60)) : formatWeekRange(start)}
        subtitle={`${view === "dia" && date === toLocalDate(now) ? "Hoje · " : ""}Agenda geral · ${counts.total} agendamentos · ${counts.done} concluídos · ${counts.scheduled} agendados`}
        actions={
          <>
            <AgendaToolbar
              basePath="/painel/agenda"
              date={date}
              view={view}
              allowWeek={!!selected}
              extraQuery={selected ? `&barbeiro=${selected.id}` : ""}
            />
            <LinkButton href="/agenda/bloqueios" variant="secondary" size="sm">
              Bloqueios
            </LinkButton>
            <LinkButton href="/agenda/novo" size="sm">
              <CalendarPlus />
              Novo agendamento
            </LinkButton>
          </>
        }
      />

      <BarberSelect barbers={allBarbers} value={selected?.id ?? null} path="/painel/agenda" params={{ data: date, vista: agendaParams.view }} allLabel="Todos" />

      {barbers.length === 0 ? (
        <Card>
          <EmptyState title="Nenhum barbeiro cadastrado" text="Cadastre a equipe para abrir a agenda." />
        </Card>
      ) : selected && view === "semana" ? (
        <AgendaWeek start={start} appointments={agenda.appointments} blocks={agenda.blocks} now={now} />
      ) : (
        <AgendaGrid agenda={agenda} barbers={selected ? [selected] : barbers} date={date} now={now} />
      )}
    </>
  );
}
