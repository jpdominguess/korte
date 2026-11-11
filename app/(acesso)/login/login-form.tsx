"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PasswordInput } from "~/_components/password-input";
import { Button, Check, Field, FormError, Input } from "~/_components/ui";
import { authClient } from "~/_lib/auth-client";

interface LoginFormProps {
  next?: string;
  /** Quando informado, roda no lugar do redirecionamento (ex.: confirmar o agendamento). */
  onDone?: () => Promise<void>;
  submitLabel?: string;
}

export function LoginForm({ next = "/inicio", onDone, submitLabel = "Entrar" }: LoginFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const result = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
      rememberMe: form.get("remember") === "on",
    });
    if (result.error) {
      setError("E-mail ou senha incorretos.");
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
      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required className="h-12" />
      </Field>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor="password" className="text-sm font-semibold">
            Senha
          </label>
          <Link href="/esqueci-senha" className="text-sm font-semibold text-destaque no-underline hover:underline">
            Esqueci minha senha
          </Link>
        </div>
        <PasswordInput id="password" name="password" autoComplete="current-password" />
      </div>
      <Check name="remember" defaultChecked>
        Manter conectado neste aparelho
      </Check>
      <FormError message={error} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Entrando..." : submitLabel}
      </Button>
    </form>
  );
}
