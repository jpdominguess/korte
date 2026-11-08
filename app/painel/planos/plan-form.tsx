"use client";

import { useRouter } from "next/navigation";
import type { PlanDTO, ServiceDTO } from "@/application/dto";
import { Button, Card, Check, Field, FormError, Input, LinkButton } from "~/_components/ui";
import { useSubmit } from "~/_lib/use-submit";

export function PlanForm({ plan, services }: { plan?: PlanDTO; services: ServiceDTO[] }) {
  const router = useRouter();
  const { pending, error, submit } = useSubmit();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      name: form.get("name"),
      price: String(form.get("price")).replace(",", "."),
      usesPerCycle: form.get("usesPerCycle"),
      active: form.get("active") === "on",
      serviceIds: form.getAll("serviceIds"),
    };
    await submit(plan ? `/api/planos/${plan.id}` : "/api/planos", plan ? "PUT" : "POST", body, () => {
      router.push("/painel/planos");
      router.refresh();
    });
  }

  return (
    <Card className="max-w-2xl p-4 lg:p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nome do plano" htmlFor="name">
          <Input id="name" name="name" required maxLength={80} defaultValue={plan?.name} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Preço por 30 dias (R$)" htmlFor="price">
            <Input id="price" name="price" inputMode="decimal" required pattern="[0-9]+([.,][0-9]{1,2})?" defaultValue={plan?.price.toFixed(2).replace(".", ",")} />
          </Field>
          <Field label="Usos a cada 30 dias" htmlFor="usesPerCycle">
            <Input id="usesPerCycle" name="usesPerCycle" type="number" min={1} required defaultValue={plan?.usesPerCycle} />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Serviços incluídos</legend>
          <div className="grid gap-x-4 sm:grid-cols-2">
            {services.map((service) => (
              <Check key={service.id} name="serviceIds" value={service.id} defaultChecked={plan?.serviceIds.includes(service.id)}>
                {service.name}
              </Check>
            ))}
          </div>
        </fieldset>
        <Check name="active" defaultChecked={plan?.active ?? true}>
          Ativo (pode ser contratado)
        </Check>
        <FormError message={error} />
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
          <LinkButton href="/painel/planos" variant="secondary">
            Voltar
          </LinkButton>
        </div>
      </form>
    </Card>
  );
}
