import Link from "next/link";
import { Ban } from "lucide-react";
import type { AgendaDTO, BarberDTO } from "@/application/dto";
import type { AppointmentStatus } from "@/domain/entities/appointment";
import { formatTime } from "@/domain/shared/format";
import { minutesOfDay, minutesToTime, toLocalDate, weekdayOf } from "@/domain/shared/time";
import { Avatar } from "~/_components/ui";

const PX_PER_HOUR = 64;
const COLUMN_MIN_WIDTH = 168;

const blockStyle: Record<AppointmentStatus, string> = {
  AGENDADO: "border-[#d5d9f1] bg-info-bg text-info",
  CONCLUIDO: "border-[#cde6d7] bg-sucesso-bg text-sucesso",
  CANCELADO: "border-borda bg-muted text-texto-2",
  FALTOU: "border-[#f4cfca] bg-erro-bg text-erro",
};

const px = (minutes: number) => (minutes * PX_PER_HOUR) / 60;

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

  const nowMinute = toLocalDate(now) === date ? minutesOfDay(now) : null;
  const showNow = nowMinute !== null && nowMinute >= first && nowMinute <= last;

  return (
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

          {barbers.map((barber) => {
            const intervals = dayIntervals.filter((i) => i.barberProfileId === barber.id).sort((a, b) => a.startMin - b.startMin);
            const offRanges: Array<[number, number]> = [];
            let cursor = first;
            for (const interval of intervals) {
              if (interval.startMin > cursor) offRanges.push([cursor, interval.startMin]);
              cursor = Math.max(cursor, interval.endMin);
            }
            if (cursor < last) offRanges.push([cursor, last]);

            return (
              <div
                key={barber.id}
                className="relative border-l border-borda"
                style={{
                  backgroundImage: "linear-gradient(to bottom, var(--color-borda) 1px, transparent 1px), linear-gradient(to bottom, var(--color-muted) 1px, transparent 1px)",
                  backgroundSize: `100% ${PX_PER_HOUR}px, 100% ${PX_PER_HOUR / 2}px`,
                }}
              >
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
  );
}
