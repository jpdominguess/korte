"use client";

import { useState } from "react";
import { Button, FormError, Input, Select } from "~/_components/ui";
import { useSubmit } from "~/_lib/use-submit";

const METHODS = [
  { value: "CASH", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "DEBIT", label: "Débito" },
  { value: "CREDIT", label: "Crédito" },
];

export function RenewButton({ subscriptionId, price }: { subscriptionId: string; price: number }) {
  const [open, setOpen] = useState(false);
  const { pending, error, submit } = useSubmit();

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Renovar
      </Button>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await submit(`/api/assinaturas/${subscriptionId}`, "PUT", {
      action: "renovar",
      amount: String(form.get("amount")).replace(",", "."),
      method: form.get("method"),
    });
    if (ok) setOpen(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-wrap items-center gap-2">
      <Input name="amount" aria-label="Valor pago" inputMode="decimal" required pattern="[0-9]+([.,][0-9]{1,2})?" defaultValue={price.toFixed(2).replace(".", ",")} className="h-9 w-24" />
      <Select name="method" aria-label="Forma de pagamento" required defaultValue="" className="h-9 w-32">
        <option value="">Forma</option>
        {METHODS.map((method) => (
          <option key={method.value} value={method.value}>
            {method.label}
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Salvando..." : "Confirmar"}
      </Button>
      <Button variant="ghost" size="sm" disabled={pending} onClick={() => setOpen(false)}>
        Voltar
      </Button>
      <FormError message={error} />
    </form>
  );
}
