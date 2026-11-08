"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Check, CreditCard, QrCode } from "lucide-react";
import type { SubscriptionCoverageDTO } from "@/application/dto";
import { formatBRL, formatLocalDate } from "@/domain/shared/format";
import { Button, Field, FormError, Input, LinkButton } from "~/_components/ui";
import { useSubmit } from "~/_lib/use-submit";

const METHODS = [
  { value: "CASH", label: "Dinheiro", icon: Banknote },
  { value: "PIX", label: "PIX", icon: QrCode },
  { value: "DEBIT", label: "Débito", icon: CreditCard },
  { value: "CREDIT", label: "Crédito", icon: CreditCard },
];

interface Props {
  appointmentId: string;
  price: number;
  backHref: string;
  coverage: SubscriptionCoverageDTO | null;
}

export function CompleteForm({ appointmentId, price, backHref, coverage }: Props) {
  const router = useRouter();
  const { pending, error, submit } = useSubmit();
  const [useSubscription, setUseSubscription] = useState(!!coverage?.covered);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await submit(
      `/api/agendamentos/${appointmentId}/concluir`,
      "POST",
      useSubscription
        ? { useSubscription: true }
        : { useSubscription: false, amount: String(form.get("amount")).replace(",", "."), method: form.get("method") },
      () => {
        router.push(backHref);
        router.refresh();
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {coverage && (
        <label className={`flex items-start gap-2.5 rounded-controle border p-3 text-sm ${coverage.covered ? "border-marinho bg-marinho-claro" : "border-borda bg-muted"}`}>
          <input type="checkbox" checked={useSubscription} disabled={!coverage.covered} onChange={(e) => setUseSubscription(e.target.checked)} className="mt-0.5 size-4.5" />
          <span>
            <strong className="block">
              {coverage.planName} · {coverage.remainingUses} de {coverage.totalUses} usos restantes
            </strong>
            <span className="text-texto-2">
              {coverage.covered ? `Válida até ${formatLocalDate(coverage.cycleEnd)}. Ao concluir, o atendimento sai por R$ 0,00.` : "Este serviço não está disponível na assinatura do cliente."}
            </span>
          </span>
        </label>
      )}

      {useSubscription ? (
        <p className="flex items-center justify-between border-t border-borda pt-3 font-bold">
          Valor final <span className="num text-lg">{formatBRL(0)}</span>
        </p>
      ) : (
        <>
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
        </>
      )}
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
