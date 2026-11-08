"use client";

import { Button, FormError } from "~/_components/ui";
import { useSubmit } from "~/_lib/use-submit";

export function EnableOwnerButton() {
  const { pending, error, submit } = useSubmit();
  return (
    <>
      <Button variant="secondary" disabled={pending} onClick={() => submit("/api/barbeiros/meu-perfil", "POST", undefined)}>
        Também atendo clientes
      </Button>
      <FormError message={error} />
    </>
  );
}
