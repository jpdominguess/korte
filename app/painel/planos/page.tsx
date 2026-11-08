import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus, UserPlus } from "lucide-react";
import type { SubscriptionDTO } from "@/application/dto";
import type { SubscriptionSituation } from "@/domain/entities/subscription";
import { formatBRL, formatLocalDate } from "@/domain/shared/format";
import { useCases } from "@/infrastructure/container";
import { ConfirmButton } from "~/_components/confirm-button";
import { Avatar, Badge, Card, EmptyState, LinkButton, PageHeader, type Tone } from "~/_components/ui";
import { requireSession } from "~/_lib/session";
import { RenewButton } from "./renew-button";

export const metadata: Metadata = { title: "Planos e assinaturas" };

const situationInfo: Record<SubscriptionSituation, { label: string; tone: Tone }> = {
  ATIVA: { label: "Ativa", tone: "success" },
  EXPIRADA: { label: "Expirada", tone: "warning" },
  CANCELADA: { label: "Cancelada", tone: "neutral" },
};

const FILTERS: Array<{ key: string; label: string; match?: SubscriptionSituation }> = [
  { key: "todas", label: "Todas" },
  { key: "ativas", label: "Ativas", match: "ATIVA" },
  { key: "expiradas", label: "Expiradas", match: "EXPIRADA" },
  { key: "canceladas", label: "Canceladas", match: "CANCELADA" },
];

export default async function PlanosPage({ searchParams }: { searchParams: Promise<{ situacao?: string }> }) {
  const { user } = await requireSession(["OWNER"]);
  const { situacao } = await searchParams;
  const [plans, subscriptions] = await Promise.all([useCases.listPlans.execute(), useCases.listSubscriptions.execute(user)]);

  const filter = FILTERS.find((f) => f.key === situacao) ?? FILTERS[0];
  const visible = filter.match ? subscriptions.filter((s) => s.situation === filter.match) : subscriptions;
  const activeCount = subscriptions.filter((s) => s.situation === "ATIVA").length;

  return (
    <>
      <PageHeader
        title="Planos e assinaturas"
        subtitle={`${activeCount} ${activeCount === 1 ? "assinatura ativa" : "assinaturas ativas"}`}
        actions={
          <>
            <LinkButton href="/painel/planos/novo" variant="secondary">
              <Plus />
              Novo plano
            </LinkButton>
            <LinkButton href="/painel/planos/ativar">
              <UserPlus />
              Ativar assinatura
            </LinkButton>
          </>
        }
      />

      {plans.length === 0 ? (
        <Card className="mb-6">
          <EmptyState title="Nenhum plano cadastrado" text="Crie um plano com preço, serviços incluídos e usos a cada 30 dias." />
        </Card>
      ) : (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.id} className="p-4 lg:p-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold">
                  {plan.name}
                  <Badge tone={plan.active ? "success" : "neutral"}>{plan.active ? "Ativo" : "Inativo"}</Badge>
                </h2>
                <p className="num shrink-0 text-right leading-tight">
                  <strong className="block text-xl">{formatBRL(plan.price)}</strong>
                  <span className="text-xs text-texto-2">por 30 dias</span>
                </p>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-texto-2">Serviços incluídos</dt>
                  <dd className="font-semibold">{plan.serviceNames.join(", ")}</dd>
                </div>
                <div>
                  <dt className="text-xs text-texto-2">Usos por ciclo</dt>
                  <dd className="font-semibold">{plan.usesPerCycle} a cada 30 dias</dd>
                </div>
                <div>
                  <dt className="text-xs text-texto-2">Assinantes ativos</dt>
                  <dd className="font-semibold">{plan.activeSubscribers}</dd>
                </div>
                <div>
                  <dt className="sr-only">Ações</dt>
                  <dd>
                    <Link href={`/painel/planos/${plan.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-destaque no-underline hover:underline">
                      <Pencil className="size-4" aria-hidden="true" />
                      Editar plano
                    </Link>
                  </dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <div role="group" aria-label="Filtrar por situação" className="flex gap-1 overflow-x-auto border-b border-borda p-2">
          {FILTERS.map((option) => {
            const count = option.match ? subscriptions.filter((s) => s.situation === option.match).length : subscriptions.length;
            const active = option.key === filter.key;
            return (
              <Link
                key={option.key}
                href={`/painel/planos?situacao=${option.key}`}
                aria-current={active ? "true" : undefined}
                className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-semibold no-underline ${active ? "bg-marinho-claro text-marinho" : "text-texto-2 hover:bg-muted"}`}
              >
                {option.label}
                <span className="num text-xs">{count}</span>
              </Link>
            );
          })}
        </div>
        {visible.length === 0 ? (
          <EmptyState title="Nenhuma assinatura aqui" />
        ) : (
          <ul>
            {visible.map((subscription) => (
              <SubscriptionRow key={subscription.id} subscription={subscription} />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function SubscriptionRow({ subscription: s }: { subscription: SubscriptionDTO }) {
  const info = situationInfo[s.situation];
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-borda px-4 py-3 last:border-b-0 lg:grid lg:grid-cols-[minmax(0,1fr)_128px_72px_84px_230px] lg:px-6">
      <div className="flex min-w-48 flex-1 items-center gap-3">
        <Avatar name={s.clientName} size="sm" />
        <div className="min-w-0 leading-tight">
          <p className="truncate font-semibold">{s.clientName}</p>
          <p className="truncate text-xs text-texto-2">{s.clientPhone ?? s.planName}</p>
        </div>
      </div>
      <p className="num w-32 text-sm leading-tight">
        <strong className="block">{s.situation === "CANCELADA" ? "Cancelada" : `até ${formatLocalDate(s.cycleEnd)}`}</strong>
        <span className="text-xs text-texto-2">{s.planName}</span>
      </p>
      <p className="num w-20 text-sm">{s.situation === "ATIVA" ? `${s.remainingUses} de ${s.totalUses}` : "—"}</p>
      <div>
        <Badge tone={info.tone}>{info.label}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        {s.situation !== "CANCELADA" && <RenewButton subscriptionId={s.id} price={s.planPrice} />}
        {s.situation === "ATIVA" && (
          <ConfirmButton url={`/api/assinaturas/${s.id}`} method="PUT" body={{ action: "cancelar" }} label="Cancelar" confirmLabel="Confirmar cancelamento" />
        )}
      </div>
    </li>
  );
}
