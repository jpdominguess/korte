import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { formatLongDate } from "@/domain/shared/format";
import { localToInstant } from "@/domain/shared/time";
import { useCases } from "@/infrastructure/container";
import { AgendaGrid } from "~/_components/agenda-grid";
import { AgendaToolbar, readAgendaParams } from "~/_components/agenda-toolbar";
import { AgendaWeek } from "~/_components/agenda-week";
import { LinkButton, PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";

export const metadata: Metadata = { title: "Minha agenda" };

export default async function MinhaAgendaPage({ searchParams }: { searchParams: Promise<{ data?: string; vista?: string }> }) {
  const { user } = await requireSession(["OWNER", "BARBER"]);
  if (!user.barberProfileId) redirect(user.isOwner() ? "/painel/agenda" : "/inicio");

  const now = new Date();
  const { date, view, start, from, to } = readAgendaParams(await searchParams, now);
  const [agenda, managed] = await Promise.all([
    useCases.getAgenda.execute(user, { from, to, barberProfileId: user.barberProfileId }),
    useCases.getManagedBarbers.execute(user),
  ]);
  const { appointments, blocks } = agenda;
  const me = managed.find((barber) => barber.id === user.barberProfileId);
  const done = appointments.filter((a) => a.status === "CONCLUIDO").length;

  return (
    <>
      <PageHeader
        title="Minha agenda"
        subtitle={`${view === "dia" ? formatLongDate(localToInstant(date, 12 * 60)) : "Semana"} · ${appointments.length} ${appointments.length === 1 ? "agendamento" : "agendamentos"} · ${done} ${done === 1 ? "concluído" : "concluídos"}`}
        actions={
          <>
            <AgendaToolbar basePath="/agenda" date={date} view={view} />
            <LinkButton href="/agenda/bloqueios" variant="secondary" size="sm">
              Bloqueios
            </LinkButton>
          </>
        }
      />
      {view === "semana" ? (
        <AgendaWeek start={start} appointments={appointments} blocks={blocks} now={now} />
      ) : (
        me && <AgendaGrid agenda={agenda} barbers={[me]} date={date} now={now} />
      )}
    </>
  );
}
