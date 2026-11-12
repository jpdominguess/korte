import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatLongDate, formatMonth } from "@/domain/shared/format";
import { addDays, addMonths, lastDayOfMonth, weekdayOf } from "@/domain/shared/time";
import { buttonClass } from "./ui";

const WEEKDAY_INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"];

interface Props {
  basePath: string;
  /** Dia mostrado na agenda (YYYY-MM-DD). */
  selected: string;
  /** Mês exibido no calendário (YYYY-MM). */
  month: string;
  today: string;
  /** Quantidade de clientes marcados por dia do mês. */
  counts: Record<string, number>;
  /** Dias da semana com expediente; os outros aparecem apagados. */
  workdays: number[];
}

/** Calendário do mês: clicar num dia troca o dia mostrado na agenda. */
export function MonthCalendar({ basePath, selected, month, today, counts, workdays }: Props) {
  const first = `${month}-01`;
  const last = lastDayOfMonth(month);
  const days: Array<string | null> = Array(weekdayOf(first)).fill(null);
  for (let day = first; day <= last; day = addDays(day, 1)) days.push(day);
  const href = (date: string, monthShown?: string) => `${basePath}?data=${date}${monthShown ? `&mes=${monthShown}` : ""}`;

  return (
    <section aria-label="Calendário" className="rounded-card border border-borda bg-superficie p-4">
      <div className="mb-3 flex items-center justify-between">
        <Link href={href(selected, addMonths(month, -1))} aria-label="Mês anterior" className={buttonClass("ghost", "sm", "w-9 px-0")}>
          <ChevronLeft />
        </Link>
        <p className="font-bold">{formatMonth(month)}</p>
        <Link href={href(selected, addMonths(month, 1))} aria-label="Próximo mês" className={buttonClass("ghost", "sm", "w-9 px-0")}>
          <ChevronRight />
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_INITIALS.map((initial, index) => (
          <span key={index} aria-hidden="true" className="pb-1 text-xs font-semibold text-texto-2">
            {initial}
          </span>
        ))}
        {days.map((day, index) => {
          if (!day) return <span key={`vazio-${index}`} />;
          const count = counts[day] ?? 0;
          const isSelected = day === selected;
          const tone = isSelected
            ? "bg-marinho text-white"
            : day === today
              ? "text-destaque ring-1 ring-destaque ring-inset hover:bg-muted"
              : workdays.includes(weekdayOf(day))
                ? "text-texto hover:bg-muted"
                : "text-texto-3 hover:bg-muted";
          return (
            <Link
              key={day}
              href={href(day)}
              aria-current={isSelected ? "date" : undefined}
              aria-label={`${formatLongDate(new Date(`${day}T15:00:00Z`))}${count ? `, ${count} ${count === 1 ? "cliente" : "clientes"}` : ""}`}
              className={`relative flex h-10 items-center justify-center rounded-controle text-sm font-semibold no-underline transition-colors ${tone}`}
            >
              <span className="num">{Number(day.slice(8))}</span>
              {count > 0 && <span aria-hidden="true" className={`absolute bottom-1.5 size-1 rounded-full ${isSelected ? "bg-white" : "bg-destaque"}`} />}
            </Link>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-texto-2">Ponto: dia com clientes marcados. Número apagado: fora do expediente.</p>
    </section>
  );
}
