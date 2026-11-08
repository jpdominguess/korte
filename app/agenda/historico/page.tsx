import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { formatBRL, formatShortDate, formatTime } from "@/domain/shared/format";
import { addDays, isLocalDate, localToInstant, toLocalDate } from "@/domain/shared/time";
import { useCases } from "@/infrastructure/container";
import { statusInfo } from "~/_components/agenda-list";
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";

export const metadata: Metadata = { title: "Atendimentos" };

export default async function HistoricoPage({ searchParams }: { searchParams: Promise<{ de?: string; ate?: string }> }) {
  const { user } = await requireSession(["OWNER", "BARBER"]);
  if (!user.barberProfileId) redirect("/painel");

  const params = await searchParams;
  const today = toLocalDate(new Date());
  const start = isLocalDate(params.de) ? params.de : `${today.slice(0, 7)}-01`;
  const end = isLocalDate(params.ate) ? params.ate : today;

  const { appointments } = await useCases.getAgenda.execute(user, {
    from: localToInstant(start, 0),
    to: localToInstant(addDays(end, 1), 0),
    barberProfileId: user.barberProfileId,
  });
  const newestFirst = [...appointments].reverse();
  const count = (status: string) => appointments.filter((a) => a.status === status).length;
  const revenue = appointments.reduce((total, a) => total + (a.paidAmount ?? 0), 0);

  const summary = [
    { label: "Concluídos", value: String(count("CONCLUIDO")) },
    { label: "Faltas", value: String(count("FALTOU")) },
    { label: "Cancelados", value: String(count("CANCELADO")) },
    { label: "Valor registrado", value: formatBRL(revenue) },
  ];

  return (
    <>
      <PageHeader title="Atendimentos" subtitle="Sua agenda e seus atendimentos no período." />

      <form className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="De" htmlFor="de">
          <Input id="de" name="de" type="date" defaultValue={start} className="w-40" />
        </Field>
        <Field label="Até" htmlFor="ate">
          <Input id="ate" name="ate" type="date" defaultValue={end} className="w-40" />
        </Field>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      <dl className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label} className="p-4">
            <dt className="text-xs font-semibold text-texto-2">{item.label}</dt>
            <dd className="num mt-1 text-xl font-bold">{item.value}</dd>
          </Card>
        ))}
      </dl>

      <Card>
        {newestFirst.length === 0 ? (
          <EmptyState title="Nenhum atendimento neste período" />
        ) : (
          <ul>
            {newestFirst.map((a) => {
              const info = statusInfo[a.status];
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 border-b border-borda px-4 py-3 last:border-b-0 lg:px-6">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{a.clientName}</p>
                    <p className="num truncate text-sm text-texto-2">
                      {formatShortDate(a.startsAt)} {formatTime(a.startsAt)} · {a.serviceName}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {a.status === "CONCLUIDO" && (
                      <span className="num text-sm font-semibold">{a.coveredBySubscription ? "Assinatura" : formatBRL(a.paidAmount ?? 0)}</span>
                    )}
                    <Badge tone={info.tone}>{info.label}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
