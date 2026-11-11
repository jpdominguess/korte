import Link from "next/link";
import { CalendarPlus, MapPin, MessageCircle } from "lucide-react";
import { formatBRL, whatsappLink } from "@/domain/shared/format";
import { toLocalDate } from "@/domain/shared/time";
import { useCases } from "@/infrastructure/container";
import { Badge, EmptyState, buttonClass } from "~/_components/ui";
import { getSession } from "~/_lib/session";
import { BookingPanel, type Viewer } from "./_booking/booking-panel";

export const dynamic = "force-dynamic";

export default async function PublicPage() {
  const [page, session] = await Promise.all([useCases.getPublicPage.execute(), getSession()]);
  const { barbershop: shop, services, barbers, plans, openingHours, openNow, statusDetail } = page;

  if (!shop) return <EmptyState title="Barbearia não configurada" text="Rode o seed do banco para criá-la." />;

  const viewer: Viewer = !session ? null : session.user.isClient() ? "CLIENT" : "STAFF";
  const subscription = viewer === "CLIENT" && session ? await useCases.getClientSubscription.execute(session.user) : null;
  const address = [shop.street && [shop.street, shop.number].filter(Boolean).join(", "), shop.city].filter(Boolean);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([shop.name, ...address].join(", "))}`;

  return (
    <div className="min-h-dvh">
      <header className="bg-marinho text-white">
        <div className="mx-auto max-w-5xl px-4 pt-3 pb-8 lg:pb-12">
          <div className="flex items-center justify-between">
            <span className="font-marca text-xl">Korte</span>
            <Link href={session ? "/inicio" : "/login"} className={buttonClass("inverse", "sm")}>
              {session ? "Minha conta" : "Entrar"}
            </Link>
          </div>

          <div className="mt-6 flex flex-col gap-6 lg:mt-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              {shop.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- o logo é um endereço externo escolhido pelo dono
                <img src={shop.logoUrl} alt="" className="size-16 shrink-0 rounded-card object-cover" />
              )}
              <div className="min-w-0">
                <h1 className="font-marca text-4xl leading-tight text-balance lg:text-5xl">{shop.name}</h1>
                {address.length > 0 && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-start gap-1.5 text-sm text-white/80 no-underline hover:text-white hover:underline"
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {address.join(" · ")}
                  </a>
                )}
                {openingHours && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm">
                    <Badge tone={openNow ? "success" : "neutral"}>{openNow ? "Aberto agora" : "Fechado agora"}</Badge>
                    {statusDetail && <span className="font-semibold">{statusDetail}</span>}
                    <span className="text-white/70">{openingHours}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              {shop.whatsapp && (
                <a href={whatsappLink(shop.whatsapp)} target="_blank" rel="noreferrer" className={buttonClass("inverse", "lg", "flex-1 px-5 lg:flex-none")}>
                  <MessageCircle />
                  WhatsApp
                </a>
              )}
              <a href="#agendar" className={buttonClass("secondary", "lg", "flex-1 px-5 lg:flex-none")}>
                <CalendarPlus />
                Agendar horário
              </a>
            </div>
          </div>
        </div>
      </header>

      <BookingPanel
        services={services.filter((service) => service.barberIds.length > 0)}
        barbers={barbers}
        today={toLocalDate(new Date())}
        viewer={viewer}
        subscription={subscription?.situation === "ATIVA" && subscription.remainingUses > 0 ? subscription : null}
        aside={
          plans.length > 0 && (
            <section aria-labelledby="titulo-clube">
              <h2 id="titulo-clube" className="mb-3 font-marca text-2xl">
                Clube de assinatura
              </h2>
              <ul className="flex flex-col gap-2">
                {plans.map((plan) => (
                  <li key={plan.id} className="flex items-center justify-between gap-3 rounded-card border border-marinho bg-superficie px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="leading-tight font-bold">{plan.name}</p>
                      <p className="mt-0.5 text-xs text-texto-2">
                        {plan.usesPerCycle} {plan.usesPerCycle === 1 ? "uso" : "usos"} a cada 30 dias · {plan.serviceNames.join(", ")} · contratação no balcão
                      </p>
                    </div>
                    <p className="num shrink-0 text-right leading-tight">
                      <strong className="block text-xl">{formatBRL(plan.price)}</strong>
                      <span className="text-xs text-texto-2">por mês</span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )
        }
      />
    </div>
  );
}
