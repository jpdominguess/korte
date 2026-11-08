"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClientOptionDTO, PlanDTO } from "@/application/dto";
import { Button, Card, Field, FormError, Input, LinkButton, Select } from "~/_components/ui";
import { useSubmit } from "~/_lib/use-submit";

const PAYMENT_OPTIONS = [
  { value: "CASH", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "DEBIT", label: "Débito" },
  { value: "CREDIT", label: "Crédito" },
];

export function ActivateForm({ clients, plans }: { clients: ClientOptionDTO[]; plans: PlanDTO[] }) {
  const router = useRouter();
  const { pending, error, submit } = useSubmit();
  const [amount, setAmount] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await submit(
      "/api/assinaturas",
      "POST",
      {
        clientId: form.get("clientId"),
        planId: form.get("planId"),
        amount: String(form.get("amount")).replace(",", "."),
        method: form.get("method"),
      },
      () => {
        router.push("/painel/planos");
        router.refresh();
      },
    );
  }

  return (
    <Card className="max-w-2xl p-4 lg:p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Cliente" htmlFor="clientId">
          <Select id="clientId" name="clientId" required defaultValue="">
            <option value="">Escolha</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
                {client.phone ? ` · ${client.phone}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Plano" htmlFor="planId">
          <Select
            id="planId"
            name="planId"
            required
            defaultValue=""
            onChange={(e) => {
              const plan = plans.find((p) => p.id === e.target.value);
              setAmount(plan ? plan.price.toFixed(2).replace(".", ",") : "");
            }}
          >
            <option value="">Escolha</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Valor pago (R$)" htmlFor="amount">
            <Input id="amount" name="amount" inputMode="decimal" required pattern="[0-9]+([.,][0-9]{1,2})?" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Forma de pagamento" htmlFor="method">
            <Select id="method" name="method" required defaultValue="">
              <option value="">Escolha</option>
              {PAYMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <FormError message={error} />
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Ativando..." : "Ativar assinatura"}
          </Button>
          <LinkButton href="/painel/planos" variant="secondary">
            Voltar
          </LinkButton>
        </div>
      </form>
    </Card>
  );
}
