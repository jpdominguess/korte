import { Ban } from "lucide-react";
import type { AppointmentDTO, BlockDTO } from "@/application/dto";
import type { AppointmentStatus } from "@/domain/entities/appointment";
import { formatTime } from "@/domain/shared/format";
import { AppointmentActions } from "./appointment-actions";
import { Badge, type Tone } from "./ui";

export const statusInfo: Record<AppointmentStatus, { label: string; tone: Tone }> = {
  AGENDADO: { label: "Agendado", tone: "info" },
  CONCLUIDO: { label: "Concluído", tone: "success" },
  CANCELADO: { label: "Cancelado", tone: "neutral" },
  FALTOU: { label: "Faltou", tone: "danger" },
};

type Entry = { kind: "appointment"; at: Date; item: AppointmentDTO } | { kind: "block"; at: Date; item: BlockDTO };

export function AgendaList({
  appointments,
  blocks,
  now,
  showBarber = false,
}: {
  appointments: AppointmentDTO[];
  blocks: BlockDTO[];
  now: Date;
  showBarber?: boolean;
}) {
  const entries: Entry[] = [
    ...appointments.map((item) => ({ kind: "appointment" as const, at: item.startsAt, item })),
    ...blocks.map((item) => ({ kind: "block" as const, at: item.startsAt, item })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  return (
    <ol>
      {entries.map((entry) =>
        entry.kind === "block" ? (
          <li key={entry.item.id} className="hachurado flex min-h-10 items-center gap-2.5 border-b border-borda px-4 py-2 text-sm font-semibold text-texto-2 last:border-b-0">
            <Ban className="size-4 shrink-0" aria-hidden="true" />
            {entry.item.reason || "Bloqueado"}
            <span className="num font-medium">
              {formatTime(entry.item.startsAt)} às {formatTime(entry.item.endsAt)}
            </span>
          </li>
        ) : (
          <AppointmentRow key={entry.item.id} appointment={entry.item} now={now} showBarber={showBarber} />
        ),
      )}
    </ol>
  );
}

function AppointmentRow({ appointment: a, now, showBarber }: { appointment: AppointmentDTO; now: Date; showBarber: boolean }) {
  const happeningNow = a.status === "AGENDADO" && a.startsAt <= now && now < a.endsAt;
  const info = statusInfo[a.status];

  return (
    <li className={`grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-borda px-4 py-2 last:border-b-0 ${happeningNow ? "bg-info-bg" : ""}`}>
      <div className="num leading-tight">
        <p className={`text-sm font-bold ${a.status === "AGENDADO" ? "" : "text-texto-2"}`}>{formatTime(a.startsAt)}</p>
        <p className="text-xs text-texto-2">{a.durationMin} min</p>
      </div>
      <div className="min-w-0 leading-snug">
        <p className={`truncate font-semibold ${a.status === "CANCELADO" ? "font-medium text-texto-2 line-through" : ""}`}>{a.clientName}</p>
        <p className="truncate text-sm text-texto-2">
          {a.serviceName}
          {showBarber && ` · ${a.barberName}`}
        </p>
      </div>
      <Badge tone={info.tone}>{info.label}</Badge>
      {a.status === "AGENDADO" && <AppointmentActions appointmentId={a.id} started={a.startsAt <= now} />}
    </li>
  );
}
