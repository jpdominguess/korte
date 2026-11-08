"use client";

import { useRef } from "react";
import type { BarberDTO } from "@/application/dto";
import { Button, Card, Field, FormError, Input, Select } from "~/_components/ui";
import { useSubmit } from "~/_lib/use-submit";

export function BlockForm({ barbers }: { barbers: BarberDTO[] }) {
  const { pending, error, submit } = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await submit("/api/bloqueios", "POST", {
      barberProfileId: form.get("barberProfileId"),
      startsAt: form.get("startsAt"),
      endsAt: form.get("endsAt"),
      reason: form.get("reason"),
    });
    if (ok) formRef.current?.reset();
  }

  return (
    <Card className="p-4 lg:p-6">
      <h2 className="mb-4 font-bold">Novo bloqueio</h2>
      <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4">
        {barbers.length > 1 ? (
          <Field label="Barbeiro" htmlFor="barberProfileId">
            <Select id="barberProfileId" name="barberProfileId" required defaultValue="">
              <option value="">Escolha</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <input type="hidden" name="barberProfileId" value={barbers[0]?.id ?? ""} />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Início" htmlFor="startsAt">
            <Input id="startsAt" name="startsAt" type="datetime-local" required />
          </Field>
          <Field label="Fim" htmlFor="endsAt">
            <Input id="endsAt" name="endsAt" type="datetime-local" required />
          </Field>
        </div>
        <Field label="Motivo" htmlFor="reason">
          <Input id="reason" name="reason" maxLength={120} placeholder="Consulta médica, folga..." />
        </Field>
        <FormError message={error} />
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Bloquear período"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
