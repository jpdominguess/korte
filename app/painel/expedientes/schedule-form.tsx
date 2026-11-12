"use client";

import { useState } from "react";
import type { WorkInterval } from "@/domain/entities/work-schedule";
import { formatShortDate, formatTime } from "@/domain/shared/format";
import { minutesToTime } from "@/domain/shared/time";
import { Button, Card, FormError, Input, Notice } from "~/_components/ui";

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const SHOWN_CONFLICTS = 10;

type IntervalInput = { weekday: number; start: string; end: string };
type Conflict = { id: string; startsAt: string; clientName: string; serviceName: string };

export function ScheduleForm({ barberId, intervals }: { barberId: string; intervals: WorkInterval[] }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [conflicts, setConflicts] = useState<{ intervals: IntervalInput[]; list: Conflict[] } | null>(null);

  async function save(intervals: IntervalInput[], cancelConflicts = false) {
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch(`/api/barbeiros/${barberId}/expediente`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intervals, cancelConflicts }),
      });
      const data = await response.json().catch(() => null);
      if (response.status === 409 && data?.details?.conflicts) {
        setConflicts({ intervals, list: data.details.conflicts });
        return;
      }
      if (!response.ok) {
        setError(data?.error ?? "Não foi possível salvar. Tente novamente.");
        return;
      }
      setConflicts(null);
      setSaved(true);
    } catch {
      setError("Não foi possível salvar. Confira sua conexão e tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const list: IntervalInput[] = [];
    for (const weekday of DISPLAY_ORDER) {
      if (form.get(`on-${weekday}`) !== "on") continue;
      for (const period of [1, 2]) {
        const start = String(form.get(`start${period}-${weekday}`) ?? "");
        const end = String(form.get(`end${period}-${weekday}`) ?? "");
        if (start || end) list.push({ weekday, start, end });
      }
    }
    await save(list);
  }

  return (
    <Card className="p-4 lg:p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <ul className="flex flex-col divide-y divide-borda">
          {DISPLAY_ORDER.map((weekday) => {
            const day = intervals.filter((i) => i.weekday === weekday);
            const input = (name: string, value?: number) => (
              <Input
                type="time"
                name={`${name}-${weekday}`}
                step={600}
                defaultValue={value === undefined ? "" : minutesToTime(value)}
                aria-label={`${WEEKDAYS[weekday]}: ${name.startsWith("start") ? "início" : "fim"} do período ${name.slice(-1)}`}
              />
            );
            return (
              <li key={weekday} className="grid gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0 lg:grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
                <label className="flex h-10 items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" name={`on-${weekday}`} defaultChecked={day.length > 0} className="size-4.5" />
                  {WEEKDAYS[weekday]}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {input("start1", day[0]?.startMin)}
                  {input("end1", day[0]?.endMin)}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {input("start2", day[1]?.startMin)}
                  {input("end2", day[1]?.endMin)}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-texto-2">Use o segundo período quando houver intervalo, como o almoço.</p>
        <FormError message={error} />
        {conflicts && (
          <div role="alert" className="flex flex-col gap-3 rounded-controle bg-aviso-bg p-4 text-sm">
            <p className="font-bold text-aviso">
              {conflicts.list.length === 1 ? "1 cliente marcado ficaria fora desse expediente" : `${conflicts.list.length} clientes marcados ficariam fora desse expediente`}
            </p>
            <ul className="flex flex-col gap-1">
              {conflicts.list.slice(0, SHOWN_CONFLICTS).map((c) => (
                <li key={c.id} className="num">
                  {formatShortDate(new Date(c.startsAt))} às {formatTime(new Date(c.startsAt))} · {c.clientName} · {c.serviceName}
                </li>
              ))}
              {conflicts.list.length > SHOWN_CONFLICTS && <li className="text-texto-2">e mais {conflicts.list.length - SHOWN_CONFLICTS}</li>}
            </ul>
            <p className="text-texto-2">Para salvar, esses horários precisam ser cancelados. Se puder, avise os clientes antes.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" disabled={pending} onClick={() => save(conflicts.intervals, true)}>
                {pending ? "Salvando..." : conflicts.list.length === 1 ? "Cancelar esse horário e salvar" : `Cancelar os ${conflicts.list.length} horários e salvar`}
              </Button>
              <Button variant="secondary" disabled={pending} onClick={() => setConflicts(null)}>
                Manter como estava
              </Button>
            </div>
          </div>
        )}
        {saved && <Notice tone="success">Expediente salvo.</Notice>}
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar expediente"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
