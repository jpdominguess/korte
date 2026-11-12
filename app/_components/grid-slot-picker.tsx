"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { minutesToTime } from "@/domain/shared/time";

const STEP = 10;

interface Props {
  barberId: string;
  date: string;
  /** Minuto do topo da grade. */
  first: number;
  pxPerHour: number;
  /** Trechos livres do dia, em minutos: dentro do expediente, sem bloqueio, sem agendamento e não passados. */
  free: Array<[number, number]>;
}

/** Camada da coluna da agenda: ao clicar num espaço livre, abre o novo agendamento já com barbeiro, dia e hora. */
export function GridSlotPicker({ barberId, date, first, pxPerHour, free }: Props) {
  const router = useRouter();
  const [hover, setHover] = useState<number | null>(null);

  function minuteAt(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const minute = first + Math.floor(((event.clientY - rect.top) * 60) / pxPerHour / STEP) * STEP;
    return free.some(([start, end]) => minute >= start && minute < end) ? minute : null;
  }

  // O balão cobre até 30 minutos, mas para no fim do espaço livre (ex.: antes do almoço).
  const hoverEnd = hover === null ? null : (free.find(([start, end]) => hover >= start && hover < end)?.[1] ?? hover + 3 * STEP);
  const ghostMinutes = hover === null || hoverEnd === null ? 0 : Math.min(3 * STEP, hoverEnd - hover);

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 z-[1] ${hover !== null ? "cursor-pointer" : ""}`}
      onMouseMove={(event) => setHover(minuteAt(event))}
      onMouseLeave={() => setHover(null)}
      onClick={(event) => {
        const minute = minuteAt(event);
        if (minute !== null) router.push(`/agenda/novo?barbeiro=${barberId}&data=${date}&hora=${minutesToTime(minute)}`);
      }}
    >
      {hover !== null && (
        <div
          className="pointer-events-none absolute inset-x-1 flex items-center overflow-hidden rounded-md whitespace-nowrap border border-dashed border-destaque bg-info-bg px-2 text-xs font-semibold text-info"
          style={{ top: ((hover - first) * pxPerHour) / 60 + 1, height: Math.max((ghostMinutes * pxPerHour) / 60 - 2, 20) }}
        >
          Marcar às {minutesToTime(hover)}
        </div>
      )}
    </div>
  );
}
