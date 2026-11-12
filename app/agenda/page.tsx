import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { formatLongDate } from "@/domain/shared/format";
import { addDays, addMonths, isLocalDate, localToInstant, toLocalDate } from "@/domain/shared/time";
import { useCases } from "@/infrastructure/container";
import { AgendaGrid } from "~/_components/agenda-grid";
import { AgendaToolbar } from "~/_components/agenda-toolbar";
import { MonthCalendar } from "~/_components/month-calendar";
import { LinkButton, PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";

export const metadata: Metadata = { title: "Minha agenda" };

export default async function MinhaAgendaPage({ searchParams }: { searchParams: Promise<{ data?: string; mes?: string }> }) {
  const { user } = await requireSession(["OWNER", "BARBER"]);
  if (!user.barberProfileId) redirect(user.isOwner() ? "/painel/agenda" : "/inicio");

  const params = await searchParams;
  const now = new Date();
  const today = toLocalDate(now);
  const date = isLocalDate(params.data) ? params.data : today;
  const month = params.mes && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.mes) ? params.mes : date.slice(0, 7);
  const own = { barberProfileId: user.barberProfileId };

  const [agenda, monthAgenda, managed] = await Promise.all([
    useCases.getAgenda.execute(user, { ...own, from: localToInstant(date, 0), to: localToInstant(addDays(date, 1), 0) }),
    useCases.getAgenda.execute(user, { ...own, from: localToInstant(`${month}-01`, 0), to: localToInstant(`${addMonths(month, 1)}-01`, 0) }),
    useCases.getManagedBarbers.execute(user),
  ]);
  const me = managed.find((barber) => barber.id === user.barberProfileId);

  const counts: Record<string, number> = {};
  for (const appointment of monthAgenda.appointments) {
    if (appointment.status === "CANCELADO") continue;
    const day = toLocalDate(appointment.startsAt);
    counts[day] = (counts[day] ?? 0) + 1;
  }
  const workdays = [...new Set(agenda.workIntervals.map((interval) => interval.weekday))];
  const active = agenda.appointments.filter((a) => a.status !== "CANCELADO").length;
  const done = agenda.appointments.filter((a) => a.status === "CONCLUIDO").length;

  return (
    <>
      <PageHeader
        title={formatLongDate(localToInstant(date, 12 * 60))}
        subtitle={`${date === today ? "Hoje · " : ""}Minha agenda · ${active} ${active === 1 ? "cliente" : "clientes"} · ${done} ${done === 1 ? "concluído" : "concluídos"}`}
        actions={
          <>
            <AgendaToolbar basePath="/agenda" date={date} view="dia" allowWeek={false} />
            <LinkButton href="/agenda/bloqueios" variant="secondary" size="sm">
              Bloqueios
            </LinkButton>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="order-2 min-w-0 lg:order-1">{me && <AgendaGrid agenda={agenda} barbers={[me]} date={date} now={now} />}</div>
        <div className="order-1 lg:sticky lg:top-6 lg:order-2">
          <MonthCalendar basePath="/agenda" selected={date} month={month} today={today} counts={counts} workdays={workdays} />
        </div>
      </div>
    </>
  );
}
