import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { useCases } from "@/infrastructure/container";
import { Avatar, Badge, Card, EmptyState, LinkButton, PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";
import { EnableOwnerButton } from "./enable-owner-button";

export const metadata: Metadata = { title: "Barbeiros" };

export default async function BarbeirosPage() {
  const { user } = await requireSession(["OWNER"]);
  const barbers = await useCases.listBarbers.execute(user);

  return (
    <>
      <PageHeader
        title="Barbeiros"
        subtitle="Quem atende na barbearia e os serviços de cada um."
        actions={
          <>
            {!user.barberProfileId && <EnableOwnerButton />}
            <LinkButton href="/painel/barbeiros/novo">
              <Plus />
              Novo barbeiro
            </LinkButton>
          </>
        }
      />
      <Card>
        {barbers.length === 0 ? (
          <EmptyState title="Nenhum barbeiro cadastrado" text="Cadastre a equipe para abrir a agenda." />
        ) : (
          <ul>
            {barbers.map((barber) => (
              <li key={barber.id} className="flex items-center gap-3 border-b border-borda px-4 py-3 last:border-b-0 lg:px-6">
                <Avatar name={barber.name} src={barber.photoUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {barber.name}
                    {barber.isOwner && <span className="ml-2 text-xs font-medium text-texto-2">dono</span>}
                  </p>
                  <p className="truncate text-sm text-texto-2">
                    {barber.serviceIds.length} {barber.serviceIds.length === 1 ? "serviço" : "serviços"} · {barber.phone ?? barber.email}
                  </p>
                </div>
                <Badge tone={barber.active ? "success" : "neutral"}>{barber.active ? "Ativo" : "Inativo"}</Badge>
                <LinkButton href={`/painel/barbeiros/${barber.id}`} variant="secondary" size="sm">
                  Editar
                </LinkButton>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
