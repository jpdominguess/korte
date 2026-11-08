"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "~/_components/password-input";
import { Button, Field, FormError } from "~/_components/ui";
import { authClient } from "~/_lib/auth-client";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const result = await authClient.resetPassword({ newPassword: String(form.get("password")), token });
    if (result.error) {
      setError("O link expirou ou já foi usado. Peça um novo para continuar.");
      setPending(false);
      return;
    }
    router.replace("/login");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Nova senha" htmlFor="password" hint="Pelo menos 8 caracteres.">
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} />
      </Field>
      <FormError message={error} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
