"use client";

import { useRouter } from "next/navigation";
import { Banknote, Check, CreditCard, QrCode } from "lucide-react";
import { Button, Field, FormError, Input, LinkButton } from "~/_components/ui";
import { useSubmit } from "~/_lib/use-submit";

const METHODS = [
  { value: "CASH", label: "Dinheiro", icon: Banknote },
  { value: "PIX", label: "PIX", icon: QrCode },
  { value: "DEBIT", label: "Débito", icon: CreditCard },
  { value: "CREDIT", label: "Crédito", icon: CreditCard },
];

export function CompleteForm({ appointmentId, price, backHref }: { appointmentId: string; price: number; backHref: string }) {
  const router = useRouter();
  const { pending, error, submit } = useSubmit();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await submit(
      `/api/agendamentos/${appointmentId}/concluir`,
      "POST",
      { amount: String(form.get("amount")).replace(",", "."), method: form.get("method") },
      () => {
        router.push(backHref);
        router.refresh();
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Valor final (R$)" htmlFor="amount">
        <Input id="amount" name="amount" inputMode="decimal" required pattern="[0-9]+([.,][0-9]{1,2})?" defaultValue={price.toFixed(2).replace(".", ",")} />
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">Forma de pagamento</legend>
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map(({ value, label, icon: Icon }) => (
            <label key={value} className="flex h-12 items-center gap-2 rounded-controle border border-borda-controle bg-superficie px-3 text-sm font-semibold has-checked:border-marinho has-checked:bg-marinho-claro">
              <input type="radio" name="method" value={value} required className="size-4" />
              <Icon className="size-4 text-texto-2" aria-hidden="true" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <FormError message={error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          <Check />
          {pending ? "Salvando..." : "Concluir atendimento"}
        </Button>
        <LinkButton href={backHref} variant="secondary">
          Voltar
        </LinkButton>
      </div>
    </form>
  );
}
