"use client";

import { useState } from "react";
import { Button, FormError } from "./ui";
import { useSubmit } from "~/_lib/use-submit";

/** Ação irreversível em dois toques, sem interromper a tela com um modal. */
export function ConfirmButton({
  url,
  method = "POST",
  body,
  label,
  confirmLabel,
}: {
  url: string;
  method?: string;
  body?: unknown;
  label: string;
  confirmLabel: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const { pending, error, submit } = useSubmit();

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" className="text-erro" onClick={() => setConfirming(true)}>
        {label}
      </Button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={async () => {
          if (await submit(url, method, body)) setConfirming(false);
        }}
      >
        {pending ? "Aguarde..." : confirmLabel}
      </Button>
      <Button variant="ghost" size="sm" disabled={pending} onClick={() => setConfirming(false)}>
        Voltar
      </Button>
      <FormError message={error} />
    </span>
  );
}
