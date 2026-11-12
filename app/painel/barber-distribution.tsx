"use client";

import { useState } from "react";
import { formatBRL } from "@/domain/shared/format";
import { Avatar, EmptyState } from "~/_components/ui";

type Metric = "revenue" | "completed" | "average";

const METRICS: Array<{ id: Metric; label: string }> = [
  { id: "revenue", label: "Faturamento" },
  { id: "completed", label: "Atendimentos" },
  { id: "average", label: "Valor médio" },
];

interface BarberRow {
  id: string;
  name: string;
  completed: number;
  share: number;
  revenue: number;
  photoUrl: string | null;
}

interface Props {
  barbers: BarberRow[];
  totals: { completed: number; appointments: number; subscriptions: number; total: number };
}

const average = (b: BarberRow) => (b.completed ? b.revenue / b.completed : 0);

/** Compara os barbeiros com barras medidas contra o primeiro colocado; trocar a métrica não muda a altura do quadro. */
export function BarberDistribution({ barbers, totals }: Props) {
  const [metric, setMetric] = useState<Metric>("revenue");
  const value = (b: BarberRow) => (metric === "revenue" ? b.revenue : metric === "completed" ? b.completed : average(b));
  const format = (v: number) => (metric === "completed" ? `${v} atend.` : formatBRL(v));
  const rows = [...barbers].sort((a, b) => value(b) - value(a));
  const max = Math.max(...rows.map(value)) || 1;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-borda px-4 py-4 lg:px-6">
        <div>
          <h2 className="font-bold">Distribuição por barbeiro</h2>
          <p className="text-sm text-texto-2">Atendimentos concluídos no período</p>
        </div>
        {rows.length > 0 && (
          <div role="group" aria-label="Comparar por" className="flex w-full rounded-controle border border-borda bg-muted p-0.5 sm:inline-flex sm:w-auto">
            {METRICS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={option.id === metric}
                onClick={() => setMetric(option.id)}
                className={`inline-flex h-8 flex-1 items-center justify-center rounded-controle px-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors sm:flex-none sm:px-2.5 sm:text-sm ${option.id === metric ? "bg-superficie text-marinho shadow-[0_1px_2px_rgba(5,9,41,.08)]" : "text-texto-2 hover:text-marinho"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Nenhum atendimento concluído neste período" />
      ) : (
        <>
          <ul>
            {rows.map((barber) => (
              <li
                key={barber.id}
                title={`${barber.name}: ${barber.completed} atendimentos (${Math.round(barber.share * 100)}% do total), ${formatBRL(barber.revenue)}, ${formatBRL(average(barber))} por atendimento`}
                className="grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-x-4 gap-y-2 border-b border-borda px-4 py-3 transition-colors last:border-b-0 hover:bg-fundo lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_7rem] lg:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={barber.name} src={barber.photoUrl} />
                  <div className="min-w-0">
                    <p className="truncate font-bold">{barber.name}</p>
                    <p className="num truncate text-xs text-texto-2">
                      {barber.completed} atend. · {formatBRL(barber.revenue)} · {formatBRL(average(barber))} cada
                    </p>
                  </div>
                </div>
                <div aria-hidden="true" className="col-span-2 row-start-2 h-3 overflow-hidden rounded-r-[4px] bg-muted lg:col-span-1 lg:col-start-2 lg:row-start-1">
                  <div
                    className="h-full rounded-r-[4px] bg-destaque motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out"
                    style={{ width: `${((value(barber) / max) * 100).toFixed(1)}%` }}
                  />
                </div>
                <p className="num col-start-2 row-start-1 text-right font-bold lg:col-start-3">{format(value(barber))}</p>
              </li>
            ))}
          </ul>
          <p className="num border-t border-borda px-4 py-3 text-sm text-texto-2 lg:px-6">
            {totals.completed} atendimentos · {formatBRL(totals.appointments)} em serviços + {formatBRL(totals.subscriptions)} em assinaturas ={" "}
            <strong className="text-texto">{formatBRL(totals.total)}</strong>
          </p>
        </>
      )}
    </>
  );
}
