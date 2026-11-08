import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function EsqueciSenhaPage() {
  return (
    <>
      <h2 className="mb-1 text-2xl font-bold tracking-tight">Recuperar senha</h2>
      <p className="mb-6 text-sm text-texto-2">Informe seu e-mail para receber o link de redefinição.</p>
      <ForgotForm />
      <p className="mt-6 text-sm">
        <Link href="/login" className="font-semibold text-destaque">
          Voltar para o login
        </Link>
      </p>
    </>
  );
}
