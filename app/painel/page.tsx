import type { Metadata } from "next";
import { Banknote, ChevronLeft, ChevronRight, Repeat, Scissors, type LucideIcon } from "lucide-react";
import { formatBRL, formatLocalDate, formatMonth, formatShortDate } from "@/domain/shared/format";
import { addMonths, currentMonth, localToInstant, toLocalDate } from "@/domain/shared/time";
import { useCases } from "@/infrastructure/container";
import { Card, LinkButton, PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";
import { BarberDistribution } from "./barber-distribution";
import { RevenueChart } from "./revenue-chart";

export const metadata: Metadata = { title: "Painel" };

function Kpi({ icon: Icon, label, value, children }: { icon: LucideIcon; label: string; value: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 lg:p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-texto-2">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </p>
      <p className="num mt-2 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-texto-2">{children}</p>
    </Card>
  );
}

export default async function PainelPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { user } = await requireSession(["OWNER"]);
  const { mes } = await searchParams;
  const now = new Date();
  const [data, team] = await Promise.all([
    useCases.getOwnerDashboard.execute(user, mes && /^\d{4}-\d{2}$/.test(mes) ? mes : undefined, now),
    useCases.listBarbers.execute(user),
  ]);
  const photos = new Map(team.map((barber) => [barber.id, barber.photoUrl]));
  const today = toLocalDate(now);
  const isCurrent = data.month === currentMonth(now);
  const short = (date: string) => formatShortDate(localToInstant(date, 12 * 60));
  const todayAmount = data.daily.find((d) => d.date === today)?.amount;

  return (
    <>
      <PageHeader
        title={formatMonth(data.month)}
        subtitle={`Painel · resultados até ${formatLocalDate(data.periodEnd).slice(0, 5)}`}
        actions={
          <>
            <LinkButton href={`/painel?mes=${addMonths(data.month, -1)}`} variant="secondary" size="sm" className="w-9 px-0">
              <ChevronLeft />
              <span className="sr-only">Mês anterior</span>
            </LinkButton>
            <LinkButton href="/painel" variant="secondary" size="sm">
              Este mês
            </LinkButton>
            {!isCurrent && (
              <LinkButton href={`/painel?mes=${addMonths(data.month, 1)}`} variant="secondary" size="sm" className="w-9 px-0">
                <ChevronRight />
                <span className="sr-only">Próximo mês</span>
              </LinkButton>
            )}
          </>
        }
      />

      <section aria-label="Indicadores do mês" className="mb-6 grid gap-4 md:grid-cols-3">
        <Kpi icon={Banknote} label="Faturamento registrado" value={formatBRL(data.revenue.total)}>
          <strong className="text-texto">{formatBRL(data.revenue.appointments)}</strong> em atendimentos +{" "}
          <strong className="text-texto">{formatBRL(data.revenue.subscriptions)}</strong> em assinaturas
        </Kpi>
        <Kpi icon={Scissors} label="Atendimentos concluídos" value={String(data.completed.total)}>
          <strong className="text-texto">{data.completed.paid}</strong> pagos e <strong className="text-texto">{data.completed.covered}</strong> cobertos por assinatura
        </Kpi>
        <Kpi icon={Repeat} label="Assinaturas ativas" value={String(data.subscriptions.active)}>
          <strong className="text-texto">{data.subscriptions.paymentsInMonth}</strong> ativações e renovações no mês
        </Kpi>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4 px-4 pt-4 lg:px-6">
            <div>
              <h2 className="font-bold">Faturamento registrado por dia</h2>
              <p className="text-sm text-texto-2">Atendimentos e assinaturas</p>
            </div>
            <p className="num shrink-0 text-right leading-tight">
              <strong className="block">{formatBRL(data.chartTotal)}</strong>
              <span className="text-xs text-texto-2">nos últimos 14 dias</span>
            </p>
          </div>
          <RevenueChart daily={data.daily} today={today} />
          <dl className="grid gap-3 border-t border-borda px-4 py-3 text-sm sm:grid-cols-3 lg:px-6">
            <div>
              <dt className="text-xs text-texto-2">Média por dia com movimento</dt>
              <dd className="num font-bold">{formatBRL(data.averagePerOpenDay)}</dd>
            </div>
            <div>
              <dt className="text-xs text-texto-2">Melhor dia</dt>
              <dd className="num font-bold">{data.bestDay ? `${short(data.bestDay.date)} · ${formatBRL(data.bestDay.amount)}` : "—"}</dd>
            </div>
            {isCurrent && (
              <div>
                <dt className="text-xs text-texto-2">Hoje</dt>
                <dd className="num font-bold">{formatBRL(todayAmount ?? 0)}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <BarberDistribution
            barbers={data.barbers.map((barber) => ({ ...barber, photoUrl: photos.get(barber.id) ?? null }))}
            totals={{ completed: data.completed.total, appointments: data.revenue.appointments, subscriptions: data.revenue.subscriptions, total: data.revenue.total }}
          />
        </Card>
      </div>
    </>
  );
}
