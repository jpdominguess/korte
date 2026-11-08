import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { formatBRL } from "@/domain/shared/format";
import { useCases } from "@/infrastructure/container";
import { Avatar, Badge, EmptyState, LinkButton } from "~/_components/ui";
import { getSession } from "~/_lib/session";

export const dynamic = "force-dynamic";

export default async function PublicPage() {
  const [page, session] = await Promise.all([useCases.getPublicPage.execute(), getSession()]);
  const { barbershop: shop, services, barbers, openingHours, openNow } = page;

  if (!shop) return <EmptyState title="Barbearia não configurada" text="Rode o seed do banco para criá-la." />;

  const address = [shop.street && [shop.street, shop.number].filter(Boolean).join(", "), shop.city].filter(Boolean);

  return (
    <div className="min-h-dvh pb-24 lg:pb-12">
      <header className="bg-marinho text-white">
        <div className="mx-auto max-w-5xl px-4 pt-4 pb-6 lg:pb-12">
          <div className="flex items-center justify-between">
            <span className="font-marca text-xl">Korte</span>
            <Link href={session ? "/inicio" : "/login"} className="text-sm font-semibold text-white">
              {session ? "Minha conta" : "Entrar"}
            </Link>
          </div>

          <div className="mt-6 flex items-end justify-between gap-6 lg:mt-12">
            <div className="flex min-w-0 items-center gap-4">
              {shop.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- o logo é um endereço externo escolhido pelo dono
                <img src={shop.logoUrl} alt="" className="size-16 shrink-0 rounded-card object-cover" />
              )}
              <div className="min-w-0">
                <h1 className="font-marca text-4xl leading-tight text-balance lg:text-5xl">{shop.name}</h1>
                {address.length > 0 && <p className="mt-2 text-sm text-white/75">{address.join(" · ")}</p>}
                {openingHours && (
                  <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm text-white/85">
                    <Badge tone={openNow ? "success" : "neutral"}>{openNow ? "Aberto agora" : "Fechado agora"}</Badge>
                    <span>{openingHours}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="hidden shrink-0 gap-2 lg:flex">
              <LinkButton href="/agendar" variant="secondary" size="lg">
                <CalendarPlus />
                Agendar horário
              </LinkButton>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-x-10 gap-y-6 px-4 pt-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:pt-10">
        <section>
          <h2 className="mb-3 font-marca text-2xl">Serviços</h2>
          {services.length === 0 ? (
            <p className="text-sm text-texto-2">Nenhum serviço disponível no momento.</p>
          ) : (
            <ul className="rounded-card border border-borda bg-superficie">
              {services.map((service) => (
                <li key={service.id} className="flex items-center justify-between gap-4 border-b border-borda px-4 py-3 last:border-b-0">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {service.name}
                      <span className="num ml-2 text-sm font-medium text-texto-2">{service.durationMin} min</span>
                    </p>
                    {service.description && <p className="text-sm text-texto-2">{service.description}</p>}
                  </div>
                  <span className="num shrink-0 font-bold">{formatBRL(service.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-3 font-marca text-2xl">Barbeiros</h2>
            {barbers.length === 0 ? (
              <p className="text-sm text-texto-2">Equipe em definição.</p>
            ) : (
              <ul className="grid grid-cols-4 gap-2 lg:grid-cols-3">
                {barbers.map((barber) => (
                  <li key={barber.id} className="flex flex-col items-center gap-1.5 text-center text-sm font-semibold">
                    <Avatar name={barber.name} size="md" />
                    {barber.name.split(" ")[0]}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-borda bg-superficie px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="flex gap-2">
          <LinkButton href="/agendar" size="lg" className="flex-1">
            Agendar horário
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
