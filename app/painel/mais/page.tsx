import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";

export const metadata: Metadata = { title: "Mais" };

export default async function MaisPage() {
  const { user } = await requireSession(["OWNER"]);
  const items = [
    ...(user.barberProfileId ? [{ href: "/agenda", label: "Minha agenda" }] : []),
    { href: "/agenda/bloqueios", label: "Bloqueios de agenda" },
    { href: "/painel/barbeiros", label: "Barbeiros" },
    { href: "/painel/servicos", label: "Serviços" },
    { href: "/painel/expedientes", label: "Expedientes" },
    { href: "/painel/planos", label: "Planos e assinaturas" },
    { href: "/painel/barbearia", label: "Barbearia" },
  ];

  return (
    <>
      <PageHeader title="Mais" />
      <Card>
        <ul>
          {items.map((item) => (
            <li key={item.href} className="border-b border-borda last:border-b-0">
              <Link href={item.href} className="flex h-13 items-center justify-between px-4 font-semibold text-texto no-underline hover:bg-muted">
                {item.label}
                <ChevronRight className="size-5 text-texto-2" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
