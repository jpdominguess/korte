import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "~/_components/ui";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Nova senha" };

export default async function RedefinirSenhaPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <>
      <h2 className="mb-6 text-2xl font-bold tracking-tight">Criar nova senha</h2>
      {token ? (
        <ResetForm token={token} />
      ) : (
        <Notice tone="danger">
          Link inválido.{" "}
          <Link href="/esqueci-senha" className="font-semibold text-destaque">
            Pedir um novo
          </Link>
        </Notice>
      )}
    </>
  );
}
