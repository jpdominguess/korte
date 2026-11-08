import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, homeFor } from "~/_lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

/** Só aceita caminhos internos, para o parâmetro não virar redirecionamento aberto. */
function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/inicio";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await getSession();
  if (session) redirect(homeFor(session.user));
  const { next } = await searchParams;
  const destination = safeNext(next);

  return (
    <>
      <h2 className="mb-6 text-2xl font-bold tracking-tight">Entrar</h2>
      <LoginForm next={destination} />
      <p className="mt-6 text-sm text-texto-2">
        Ainda não tem conta?{" "}
        <Link href={`/cadastro?next=${encodeURIComponent(destination)}`} className="font-semibold text-destaque">
          Criar conta de cliente
        </Link>
      </p>
    </>
  );
}
