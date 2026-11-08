"use client";

import { useRouter } from "next/navigation";
import type { BarberDTO, ServiceDTO } from "@/application/dto";
import { Button, Card, Check, Field, FormError, Input, LinkButton } from "~/_components/ui";
import { useSubmit } from "~/_lib/use-submit";

export function BarberForm({ barber, services }: { barber?: BarberDTO; services: ServiceDTO[] }) {
  const router = useRouter();
  const { pending, error, submit } = useSubmit();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const common = {
      name: form.get("name"),
      phone: form.get("phone"),
      serviceIds: form.getAll("serviceIds"),
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
            Ativo (recebe novos agendamentos)
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
