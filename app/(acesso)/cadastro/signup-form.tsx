"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "~/_components/password-input";
import { Button, Field, FormError, Input } from "~/_components/ui";
import { authClient } from "~/_lib/auth-client";

interface SignupFormProps {
  next?: string;
  /** Quando informado, roda no lugar do redirecionamento (ex.: confirmar o agendamento). */
  onDone?: () => Promise<void>;
  submitLabel?: string;
}

export function SignupForm({ next = "/inicio", onDone, submitLabel = "Criar conta" }: SignupFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const result = await authClient.signUp.email({
      name: String(form.get("name")).trim(),
      email: String(form.get("email")),
      phone: String(form.get("phone")).trim(),
      password: String(form.get("password")),
    });
    if (result.error) {
      setError(
        result.error.code === "USER_ALREADY_EXISTS" || result.error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
          ? "Já existe uma conta com esse e-mail."
          : "Não foi possível criar a conta. Confira os dados e tente novamente.",
      );
      setPending(false);
      return;
    }
    if (onDone) {
      await onDone();
      setPending(false);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Nome completo" htmlFor="name">
        <Input id="name" name="name" autoComplete="name" required minLength={2} className="h-12" />
      </Field>
      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required className="h-12" />
      </Field>
      <Field label="Celular" htmlFor="phone">
        <Input id="phone" name="phone" type="tel" autoComplete="tel" required placeholder="(19) 99999-9999" className="h-12" />
      </Field>
      <Field label="Senha" htmlFor="password" hint="Pelo menos 8 caracteres.">
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} />
      </Field>
      <FormError message={error} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Criando conta..." : submitLabel}
      </Button>
    </form>
  );
}
