"use client";

import { useState, useTransition } from "react";
import type { BarbershopDTO } from "@/application/dto";
import { Button, Card, Field, FormError, Input, Notice } from "~/_components/ui";
import { salvarBarbearia } from "./actions";

export function BarbershopForm({ shop }: { shop: BarbershopDTO }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await salvarBarbearia(data);
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <Card className="max-w-2xl p-4 lg:p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nome da barbearia" htmlFor="name">
          <Input id="name" name="name" required defaultValue={shop.name} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
          <Field label="CEP" htmlFor="cep">
            <Input id="cep" name="cep" inputMode="numeric" defaultValue={shop.cep ?? ""} />
          </Field>
          <Field label="Rua" htmlFor="street">
            <Input id="street" name="street" defaultValue={shop.street ?? ""} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
          <Field label="Número" htmlFor="number">
            <Input id="number" name="number" defaultValue={shop.number ?? ""} />
          </Field>
          <Field label="Cidade" htmlFor="city">
            <Input id="city" name="city" defaultValue={shop.city ?? ""} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefone" htmlFor="phone">
            <Input id="phone" name="phone" type="tel" defaultValue={shop.phone ?? ""} />
          </Field>
          <Field label="WhatsApp" htmlFor="whatsapp" hint="Com DDD, só números.">
            <Input id="whatsapp" name="whatsapp" type="tel" defaultValue={shop.whatsapp ?? ""} />
          </Field>
        </div>
        <Field label="Endereço da imagem do logo" htmlFor="logoUrl">
          <Input id="logoUrl" name="logoUrl" type="url" placeholder="https://..." defaultValue={shop.logoUrl ?? ""} />
        </Field>

        <FormError message={error} />
        {saved && <Notice tone="success">Dados da barbearia salvos.</Notice>}
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
