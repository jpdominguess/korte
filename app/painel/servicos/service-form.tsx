"use client";

import { useRouter } from "next/navigation";
import type { BarberDTO, ServiceDTO } from "@/application/dto";
import { Button, Card, Check, Field, FormError, Input, LinkButton, Textarea } from "~/_components/ui";
import { useSubmit } from "~/_lib/use-submit";

export function ServiceForm({ service, barbers }: { service?: ServiceDTO; barbers: BarberDTO[] }) {
  const router = useRouter();
  const { pending, error, submit } = useSubmit();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      name: form.get("name"),
      description: form.get("description"),
      durationMin: form.get("durationMin"),
      price: String(form.get("price")).replace(",", "."),
      active: form.get("active") === "on",
      barberIds: form.getAll("barberIds"),
    };
    await submit(service ? `/api/servicos/${service.id}` : "/api/servicos", service ? "PUT" : "POST", body, () => {
      router.push("/painel/servicos");
      router.refresh();
    });
  }

  return (
    <Card className="max-w-2xl p-4 lg:p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nome" htmlFor="name">
          <Input id="name" name="name" required defaultValue={service?.name} />
        </Field>
        <Field label="Descrição curta" htmlFor="description">
          <Textarea id="description" name="description" maxLength={200} defaultValue={service?.description ?? ""} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Duração (min)" htmlFor="durationMin">
            <Input id="durationMin" name="durationMin" type="number" min={1} max={480} required defaultValue={service?.durationMin} />
          </Field>
          <Field label="Preço (R$)" htmlFor="price">
            <Input id="price" name="price" inputMode="decimal" required pattern="[0-9]+([.,][0-9]{1,2})?" defaultValue={service?.price.toFixed(2).replace(".", ",")} />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Barbeiros que realizam</legend>
          {barbers.length === 0 ? (
            <p className="text-sm text-texto-2">Nenhum barbeiro cadastrado ainda.</p>
          ) : (
            <div className="grid gap-x-4 sm:grid-cols-2">
              {barbers.map((barber) => (
                <Check key={barber.id} name="barberIds" value={barber.id} defaultChecked={service?.barberIds.includes(barber.id)}>
                  {barber.name}
                </Check>
              ))}
            </div>
          )}
        </fieldset>

        <Check name="active" defaultChecked={service?.active ?? true}>
          Ativo (aparece para agendamento)
        </Check>

        <FormError message={error} />
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
          <LinkButton href="/painel/servicos" variant="secondary">
            Voltar
          </LinkButton>
        </div>
      </form>
    </Card>
  );
}
