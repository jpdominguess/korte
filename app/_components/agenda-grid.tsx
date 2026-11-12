import Link from "next/link";
import { Ban, Info, MousePointerClick } from "lucide-react";
import type { AgendaDTO, BarberDTO } from "@/application/dto";
import type { AppointmentStatus } from "@/domain/entities/appointment";
import { formatTime } from "@/domain/shared/format";
import { minutesOfDay, minutesToTime, toLocalDate, weekdayOf } from "@/domain/shared/time";
import { GridSlotPicker } from "./grid-slot-picker";
import { Avatar } from "./ui";

const PX_PER_HOUR = 64;
const COLUMN_MIN_WIDTH = 168;

const blockStyle: Record<AppointmentStatus, string> = {
  AGENDADO: "border-[#d5d9f1] bg-info-bg text-info",
  CONCLUIDO: "border-[#cde6d7] bg-sucesso-bg text-sucesso",
  CANCELADO: "border-borda bg-muted text-texto-2",
  FALTOU: "border-[#f4cfca] bg-erro-bg text-erro",
};

const px = (minutes: number) => (minutes * PX_PER_HOUR) / 60;

/** Tira os trechos ocupados de um intervalo e devolve o que sobra livre. */
function subtractRanges(whole: [number, number], busy: Array<[number, number]>): Array<[number, number]> {
  const free: Array<[number, number]> = [];
  let cursor = whole[0];
  for (const [start, end] of [...busy].sort((a, b) => a[0] - b[0])) {
    if (start > cursor) free.push([cursor, Math.min(start, whole[1])]);
    cursor = Math.max(cursor, end);
    if (cursor >= whole[1]) break;
  }
  if (cursor < whole[1]) free.push([cursor, whole[1]]);
  return free.filter(([start, end]) => end > start);
}

export function AgendaGrid({ agenda, barbers, date, now }: { agenda: AgendaDTO; barbers: BarberDTO[]; date: string; now: Date }) {
  const weekday = weekdayOf(date);
  const dayIntervals = agenda.workIntervals.filter((i) => i.weekday === weekday);

  const bounds = [
    ...dayIntervals.flatMap((i) => [i.startMin, i.endMin]),
    ...agenda.appointments.flatMap((a) => [minutesOfDay(a.startsAt), minutesOfDay(a.endsAt)]),
  ];
  const first = Math.floor((bounds.length ? Math.min(...bounds) : 9 * 60) / 60) * 60;
  const last = Math.ceil((bounds.length ? Math.max(...bounds) : 19 * 60) / 60) * 60;
  const height = px(last - first);
  const hours = Array.from({ length: (last - first) / 60 + 1 }, (_, i) => first + i * 60);

  const today = toLocalDate(now);
  const nowMinute = today === date ? minutesOfDay(now) : null;
  // O que já passou não pode ser marcado: o dia inteiro, se for passado, ou até o próximo horário de 10 em 10 minutos.
  const pastUntil = date < today ? last : nowMinute !== null ? Math.ceil(nowMinute / 10) * 10 : first;
  const showNow = nowMinute !== null && nowMinute >= first && nowMinute <= last;

  const columns = barbers.map((barber) => {
    const intervals = dayIntervals.filter((i) => i.barberProfileId === barber.id).sort((a, b) => a.startMin - b.startMin);
    const offRanges: Array<[number, number]> = [];
    let cursor = first;
    for (const interval of intervals) {
      if (interval.startMin > cursor) offRanges.push([cursor, interval.startMin]);
      cursor = Math.max(cursor, interval.endMin);
    }
    if (cursor < last) offRanges.push([cursor, last]);

    const minuteOf = (instant: Date, edge: number) => (toLocalDate(instant) === date ? minutesOfDay(instant) : edge);
    const free = barber.active
      ? subtractRanges([first, last], [
          ...offRanges,
          [first, pastUntil],
          ...agenda.blocks
            .filter((b) => b.barberProfileId === barber.id)
            .map((b): [number, number] => [minuteOf(b.startsAt, first), minuteOf(b.endsAt, last)]),
          ...agenda.appointments
            .filter((a) => a.barberProfileId === barber.id && a.status !== "CANCELADO")
            .map((a): [number, number] => [minutesOfDay(a.startsAt), minutesOfDay(a.endsAt)]),
        ])
      : [];
    return { barber, offRanges, free };
  });

  // Sem esta frase, uma grade sem espaço livre (dia passado, fim do expediente) parece quebrada.
  const anyFree = columns.some((column) => column.free.length > 0);
  const hint = anyFree
    ? "Clique num espaço livre da grade para marcar um horário."
    : date < today
      ? "Este dia já passou. Use as setas para ir a outro dia."
      : date === today && pastUntil >= last
        ? "Os horários de hoje já passaram. Use as setas para ir a outro dia."
        : "Não há espaço livre neste dia.";
  const HintIcon = anyFree ? MousePointerClick : Info;

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-sm text-texto-2">
        <HintIcon className="size-4 shrink-0" aria-hidden="true" />
        {hint}
      </p>
      <div className="overflow-x-auto rounded-card border border-borda bg-superficie">
      <div style={{ minWidth: 56 + barbers.length * COLUMN_MIN_WIDTH }}>
        <div className="grid h-13 border-b border-borda" style={{ gridTemplateColumns: `56px repeat(${barbers.length}, minmax(0, 1fr))` }}>
          <span />
          {barbers.map((barber) => (
            <div key={barber.id} className="flex min-w-0 items-center gap-2.5 border-l border-borda px-3">
              <Avatar name={barber.name} src={barber.photoUrl} size="sm" />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-bold">{barber.name}</p>
                <p className="text-xs whitespace-nowrap text-texto-2">
                  {agenda.appointments.filter((a) => a.barberProfileId === barber.id && a.status !== "CANCELADO").length} agendamentos
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative grid" style={{ gridTemplateColumns: `56px repeat(${barbers.length}, minmax(0, 1fr))`, height }}>
          <div className="relative">
            {hours.slice(0, -1).map((minute, index) => (
              <span key={minute} className="num absolute right-2 text-xs leading-none font-medium text-texto-2" style={{ top: px(minute - first) + (index === 0 ? 4 : -6) }}>
                {minutesToTime(minute)}
              </span>
            ))}
          </div>

          {columns.map(({ barber, offRanges, free }) => {
            return (
              <div
                key={barber.id}
                className="relative border-l border-borda"
                style={{
                  backgroundImage: "linear-gradient(to bottom, var(--color-borda) 1px, transparent 1px), linear-gradient(to bottom, var(--color-muted) 1px, transparent 1px)",
                  backgroundSize: `100% ${PX_PER_HOUR}px, 100% ${PX_PER_HOUR / 2}px`,
                }}
              >
                {free.length > 0 && <GridSlotPicker barberId={barber.id} date={date} first={first} pxPerHour={PX_PER_HOUR} free={free} />}

                {offRanges.map(([start, end]) => (
                  <div key={start} aria-hidden="true" className="hachurado absolute inset-x-0" style={{ top: px(start - first), height: px(end - start) }} />
                ))}

                {agenda.blocks
                  .filter((b) => b.barberProfileId === barber.id)
                  .map((block) => {
                    const start = Math.max(first, toLocalDate(block.startsAt) === date ? minutesOfDay(block.startsAt) : first);
                    const end = Math.min(last, toLocalDate(block.endsAt) === date ? minutesOfDay(block.endsAt) : last);
                    return (
                      <div
                        key={block.id}
                        className="hachurado absolute inset-x-1 z-1 flex items-start gap-1.5 overflow-hidden rounded-md border border-dashed border-borda-controle px-2 pt-1 text-xs font-bold text-texto-2"
                        style={{ top: px(start - first) + 1, height: Math.max(px(end - start) - 2, 20) }}
                      >
                        <Ban className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{block.reason || "Bloqueado"}</span>
                      </div>
                    );
                  })}

                {agenda.appointments
                  .filter((a) => a.barberProfileId === barber.id)
                  .map((a) => {
                    const start = minutesOfDay(a.startsAt);
                    const blockHeight = Math.max(px(a.durationMin) - 2, 20);
                    const content = (
                      <>
                        <p className={`truncate font-bold ${a.status === "CANCELADO" ? "font-semibold line-through" : "text-texto"}`}>{a.clientName}</p>
                        {blockHeight >= 32 && <p className="num truncate">{formatTime(a.startsAt)} · {a.serviceName}</p>}
                      </>
                    );
                    const className = `absolute inset-x-1 z-1 flex flex-col justify-center overflow-hidden rounded-md border px-2 text-xs leading-tight no-underline ${blockStyle[a.status]}`;
                    const style = { top: px(start - first) + 1, height: blockHeight };
                    const title = `${formatTime(a.startsAt)} ${a.clientName} · ${a.serviceName}`;
                    return a.status === "AGENDADO" ? (
                      <Link key={a.id} href={`/agenda/${a.id}/concluir`} title={title} className={`${className} hover:brightness-95`} style={style}>
                        {content}
                      </Link>
                    ) : (
                      <div key={a.id} title={title} className={className} style={style}>
                        {content}
                      </div>
                    );
                  })}
              </div>
            );
          })}

          {showNow && (
            <div aria-hidden="true" className="pointer-events-none absolute right-0 left-14 z-2 border-t-2 border-destaque" style={{ top: px(nowMinute - first) }}>
              <span className="absolute -top-1.5 -left-1.5 size-2.5 rounded-full bg-destaque" />
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
