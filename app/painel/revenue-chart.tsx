import { formatBRL, formatShortDate } from "@/domain/shared/format";
import { localToInstant } from "@/domain/shared/time";

/** Parte da altura que a maior barra ocupa; o resto fica para o valor do melhor dia. */
const BAR_SHARE = 85;

export function RevenueChart({ daily, today }: { daily: Array<{ date: string; amount: number }>; today: string }) {
  const max = Math.max(...daily.map((d) => d.amount), 1);
  const best = daily.reduce((top, d) => (d.amount > top.amount ? d : top), daily[0]);
  const label = (date: string) => formatShortDate(localToInstant(date, 12 * 60));

  return (
    <div className="flex flex-1 flex-col px-4 pb-2 lg:px-6">
      {/* No celular a área tem altura fixa; lado a lado, ela cresce até a altura do card vizinho. */}
      <div className="flex h-40 items-end gap-0.5 border-b border-borda xl:h-auto xl:min-h-40 xl:flex-1" aria-hidden="true">
        {daily.map((day) => {
          const height = day.amount > 0 ? `max(${((day.amount / max) * BAR_SHARE).toFixed(2)}%, 4px)` : "2px";
          return (
            <div key={day.date} className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end">
              {day.date === best.date && best.amount > 0 && (
                <span className="num mb-1 text-[11px] leading-none font-bold whitespace-nowrap">{best.amount.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
              )}
              <div
                className={`w-full max-w-7 rounded-t ${day.amount === 0 ? "bg-borda" : day.date === today ? "bg-marinho" : "bg-destaque group-hover:bg-marinho"}`}
                style={{ height }}
              />
              <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded-controle bg-marinho px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block">
                {label(day.date)} · {formatBRL(day.amount)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-0.5" aria-hidden="true">
        {daily.map((day) => (
          <span key={day.date} className="num flex-1 text-center text-[11px] text-texto-2">
            {day.date.slice(8)}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>Faturamento registrado por dia</caption>
        <thead>
          <tr>
            <th scope="col">Dia</th>
            <th scope="col">Valor</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((day) => (
            <tr key={day.date}>
              <td>{label(day.date)}</td>
              <td>{formatBRL(day.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
