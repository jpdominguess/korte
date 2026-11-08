"use client";

import { useState } from "react";
import { Button, Field, FormError, Input, Notice } from "~/_components/ui";
import { authClient } from "~/_lib/auth-client";

export function ForgotForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const result = await authClient.requestPasswordReset({
      email: String(form.get("email")),
      redirectTo: "/redefinir-senha",
    });
    setPending(false);
    if (result.error) setError("Não foi possível enviar agora. Tente novamente em instantes.");
    else setSent(true);
  }

  if (sent) {
    return <Notice tone="success">Se esse e-mail tiver conta, enviamos um link para criar uma nova senha.</Notice>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required className="h-12" />
      </Field>
      <FormError message={error} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Enviando..." : "Enviar link"}
      </Button>
    </form>
  );
}
