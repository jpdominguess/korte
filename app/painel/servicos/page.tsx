import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { formatBRL } from "@/domain/shared/format";
import { useCases } from "@/infrastructure/container";
import { Badge, Card, EmptyState, LinkButton, PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";

export const metadata: Metadata = { title: "Serviços" };

export default async function ServicosPage() {
  await requireSession(["OWNER"]);
  const services = await useCases.listServices.execute();

  return (
    <>
      <PageHeader
        title="Serviços"
        subtitle="O que a barbearia oferece, com preço e duração."
        actions={
          <LinkButton href="/painel/servicos/novo">
            <Plus />
            Novo serviço
          </LinkButton>
        }
      />
      <Card>
        {services.length === 0 ? (
          <EmptyState title="Nenhum serviço cadastrado" text="Cadastre os serviços para exibi-los na página pública." />
        ) : (
          <ul>
            {services.map((service) => (
              <li key={service.id} className="flex items-center gap-3 border-b border-borda px-4 py-3 last:border-b-0 lg:px-6">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{service.name}</p>
                  <p className="num truncate text-sm text-texto-2">
                    {service.durationMin} min · {service.barberIds.length}{" "}
                    {service.barberIds.length === 1 ? "barbeiro" : "barbeiros"}
                  </p>
                </div>
                <span className="num font-bold">{formatBRL(service.price)}</span>
                <Badge tone={service.active ? "success" : "neutral"}>{service.active ? "Ativo" : "Inativo"}</Badge>
                <LinkButton href={`/painel/servicos/${service.id}`} variant="secondary" size="sm">
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
