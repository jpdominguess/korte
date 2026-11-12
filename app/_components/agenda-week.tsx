import type { AppointmentDTO, BlockDTO } from "@/application/dto";
import { formatLongDate } from "@/domain/shared/format";
import { addDays, localToInstant, toLocalDate } from "@/domain/shared/time";
import { AgendaList } from "./agenda-list";
import { Card } from "./ui";

export function AgendaWeek({
  start,
  appointments,
  blocks,
  now,
  showBarber,
}: {
  start: string;
  appointments: AppointmentDTO[];
  blocks: BlockDTO[];
  now: Date;
  showBarber?: boolean;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="flex flex-col gap-4">
      {days.map((day) => {
        const dayAppointments = appointments.filter((a) => toLocalDate(a.startsAt) === day);
        const from = localToInstant(day, 0);
        const to = localToInstant(addDays(day, 1), 0);
        const dayBlocks = blocks
          .filter((b) => b.startsAt < to && b.endsAt > from)
          .map((b) => ({
            ...b,
            startsAt: b.startsAt < from ? from : b.startsAt,
            endsAt: b.endsAt > to ? to : b.endsAt,
          }));
        return (
          <Card key={day}>
            <h2 className="flex items-baseline justify-between gap-2 border-b border-borda px-4 py-2.5 text-sm font-bold">
              {formatLongDate(localToInstant(day, 12 * 60))}
              <span className="text-xs font-medium text-texto-2">
                {dayAppointments.length} {dayAppointments.length === 1 ? "agendamento" : "agendamentos"}
              </span>
            </h2>
            {dayAppointments.length + dayBlocks.length === 0 ? (
              <p className="px-4 py-3 text-sm text-texto-2">Sem agendamentos.</p>
            ) : (
              <AgendaList appointments={dayAppointments} blocks={dayBlocks} now={now} showBarber={showBarber} date={day} />
            )}
          </Card>
        );
      })}
    </div>
  );
}
