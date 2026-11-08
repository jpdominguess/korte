"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export async function apiRequest<T>(url: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? "Não foi possível concluir. Tente novamente.");
  return data as T;
}

/** Envia para a API e controla carregamento e erro; por padrão, recarrega os dados da página. */
export function useSubmit() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit<T>(url: string, method: string, body: unknown, after?: (data: T) => void) {
    setPending(true);
    setError(null);
    try {
      const data = await apiRequest<T>(url, method, body);
      if (after) after(data);
      else router.refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setPending(false);
    }
  }

  return { pending, error, setError, submit };
}
