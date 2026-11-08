import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Criar conta" };

export default async function CadastroPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const destination = next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/inicio";

  return (
    <>
      <h2 className="mb-1 text-2xl font-bold tracking-tight">Criar conta</h2>
      <p className="mb-6 text-sm text-texto-2">Para marcar horários e acompanhar seus atendimentos.</p>
      <SignupForm next={destination} />
      <p className="mt-6 text-sm text-texto-2">
        Já tem conta?{" "}
        <Link href={`/login?next=${encodeURIComponent(destination)}`} className="font-semibold text-destaque">
          Entrar
        </Link>
      </p>
    </>
  );
}
