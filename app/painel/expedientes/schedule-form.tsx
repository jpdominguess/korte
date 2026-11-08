"use client";

import { useState } from "react";
import type { WorkInterval } from "@/domain/entities/work-schedule";
import { minutesToTime } from "@/domain/shared/time";
import { Button, Card, FormError, Input, Notice } from "~/_components/ui";
import { useSubmit } from "~/_lib/use-submit";

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function ScheduleForm({ barberId, intervals }: { barberId: string; intervals: WorkInterval[] }) {
  const { pending, error, submit } = useSubmit();
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const list: Array<{ weekday: number; start: string; end: string }> = [];
    for (const weekday of DISPLAY_ORDER) {
      if (form.get(`on-${weekday}`) !== "on") continue;
      for (const period of [1, 2]) {
        const start = String(form.get(`start${period}-${weekday}`) ?? "");
        const end = String(form.get(`end${period}-${weekday}`) ?? "");
        if (start || end) list.push({ weekday, start, end });
      }
    }
    setSaved(false);
    await submit(`/api/barbeiros/${barberId}/expediente`, "PUT", { intervals: list }, () => setSaved(true));
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
