import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, isLocalDate, localToInstant, toLocalDate, weekdayOf } from "@/domain/shared/time";
import { buttonClass, LinkButton } from "./ui";
import Link from "next/link";

export type AgendaView = "dia" | "semana";

export function readAgendaParams(params: { data?: string; vista?: string }, now: Date) {
  const date = isLocalDate(params.data) ? params.data : toLocalDate(now);
  const view: AgendaView = params.vista === "semana" ? "semana" : "dia";
  const monday = addDays(date, -((weekdayOf(date) + 6) % 7));
  const start = view === "semana" ? monday : date;
  const days = view === "semana" ? 7 : 1;
  return { date, view, start, days, from: localToInstant(start, 0), to: localToInstant(addDays(start, days), 0) };
}

export function AgendaToolbar({
  basePath,
  date,
  view,
  extraQuery = "",
  allowWeek = true,
}: {
  basePath: string;
  date: string;
  view: AgendaView;
  extraQuery?: string;
  allowWeek?: boolean;
}) {
  const step = view === "semana" ? 7 : 1;
  const href = (d: string, v: AgendaView = view) => `${basePath}?data=${d}&vista=${v}${extraQuery}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <LinkButton href={href(addDays(date, -step))} variant="secondary" size="sm" className="w-9 px-0">
        <ChevronLeft />
        <span className="sr-only">Anterior</span>
      </LinkButton>
      <LinkButton href={href(toLocalDate(new Date()))} variant="secondary" size="sm">
        Hoje
      </LinkButton>
      <LinkButton href={href(addDays(date, step))} variant="secondary" size="sm" className="w-9 px-0">
        <ChevronRight />
        <span className="sr-only">Próximo</span>
      </LinkButton>
      {allowWeek && (
        <div role="group" aria-label="Visualização" className="inline-flex rounded-controle border border-borda bg-muted p-0.5">
          {(["dia", "semana"] as const).map((option) => (
            <Link
              key={option}
              href={href(date, option)}
              aria-current={option === view ? "true" : undefined}
              className={`${buttonClass("ghost", "sm", "h-8 capitalize")} ${option === view ? "bg-superficie shadow-[0_1px_2px_rgba(5,9,41,.08)]" : "text-texto-2"}`}
            >
              {option}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
