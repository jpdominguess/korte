"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BarberDTO, ServiceDTO } from "@/application/dto";
import { Button, Card, Check, Field, FormError, Input, LinkButton } from "~/_components/ui";
import { useSubmit } from "~/_lib/use-submit";
import { PhotoField } from "./photo-field";

export function BarberForm({ barber, services, isSelf = false }: { barber?: BarberDTO; services: ServiceDTO[]; isSelf?: boolean }) {
  const router = useRouter();
  const { pending, error, submit } = useSubmit();
  const [photo, setPhoto] = useState<string | null | undefined>(undefined);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const common = {
      name: form.get("name"),
      phone: form.get("phone"),
      serviceIds: form.getAll("serviceIds"),
      photo,
      role: form.get("role") || undefined,
    };
    const done = () => {
      router.push("/painel/barbeiros");
      router.refresh();
    };
    if (barber) {
      await submit(`/api/barbeiros/${barber.id}`, "PUT", { ...common, active: form.get("active") === "on" }, done);
    } else {
      await submit("/api/barbeiros", "POST", { ...common, email: form.get("email"), password: form.get("password") }, done);
    }
  }

  return (
    <Card className="max-w-2xl p-4 lg:p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Foto</span>
          <PhotoField name={barber?.name ?? ""} initialUrl={barber?.photoUrl ?? null} onChange={setPhoto} />
        </div>
        <Field label="Nome" htmlFor="name">
          <Input id="name" name="name" required defaultValue={barber?.name} />
        </Field>
        <Field label="E-mail" htmlFor="email">
          <Input id="email" name="email" type="email" required disabled={!!barber} defaultValue={barber?.email} />
        </Field>
        <Field label="Celular" htmlFor="phone">
          <Input id="phone" name="phone" type="tel" defaultValue={barber?.phone ?? ""} />
        </Field>
        {!barber && (
          <Field label="Senha inicial" htmlFor="password" hint="O barbeiro pode trocar depois em “Esqueci minha senha”.">
            <Input id="password" name="password" type="text" required minLength={8} autoComplete="new-password" />
          </Field>
        )}

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Cargo</legend>
          <div className="flex flex-wrap gap-x-6">
            <label className="inline-flex min-h-9 items-center gap-2 text-sm">
              <input type="radio" name="role" value="BARBER" defaultChecked={!barber?.isOwner} disabled={isSelf} className="size-4.5" />
              Barbeiro
            </label>
            <label className="inline-flex min-h-9 items-center gap-2 text-sm">
              <input type="radio" name="role" value="OWNER" defaultChecked={!!barber?.isOwner} disabled={isSelf} className="size-4.5" />
              Dono
            </label>
          </div>
          <p className="text-xs text-texto-2">
            {isSelf ? "Você não pode mudar o seu próprio cargo." : "Barbeiro vê a própria agenda. Dono vê e altera tudo no painel."}
          </p>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Serviços que realiza</legend>
          {services.length === 0 ? (
            <p className="text-sm text-texto-2">Nenhum serviço cadastrado ainda.</p>
          ) : (
            <div className="grid gap-x-4 sm:grid-cols-2">
              {services.map((service) => (
                <Check key={service.id} name="serviceIds" value={service.id} defaultChecked={barber?.serviceIds.includes(service.id)}>
                  {service.name}
                </Check>
              ))}
            </div>
          )}
        </fieldset>

        {barber && (
          <Check name="active" defaultChecked={barber.active}>
            Ativo (aparece na página e recebe agendamentos)
          </Check>
        )}

        <FormError message={error} />
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
          <LinkButton href="/painel/barbeiros" variant="secondary">
            Voltar
          </LinkButton>
        </div>
      </form>
    </Card>
  );
}
