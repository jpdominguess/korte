import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Calendar, Check, MessageCircle } from "lucide-react";
import { DomainError } from "@/domain/shared/errors";
import { formatBRL, formatLocalDate, formatLongDate, formatTime, whatsappLink } from "@/domain/shared/format";
import { useCases } from "@/infrastructure/container";
import { Avatar, LinkButton, buttonClass } from "~/_components/ui";
import { requireSession } from "~/_lib/session";

export const metadata: Metadata = { title: "Horário marcado" };

export default async function ConfirmadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, name } = await requireSession(["CLIENT"]);
  const { id } = await params;
  const [page, subscription, appointment] = await Promise.all([
    useCases.getPublicPage.execute(),
    useCases.getClientSubscription.execute(user),
    useCases.getAppointmentDetails.execute(user, id).catch((error) => {
      if (error instanceof DomainError) notFound();
      throw error;
    }),
  ]);
  const shop = page.barbershop;
  const barberPhoto = page.barbers.find((b) => b.id === appointment.barberProfileId)?.photoUrl;
  const location = shop && [shop.street, shop.number].filter(Boolean).join(", ");
  const covered = subscription?.situation === "ATIVA" && subscription.remainingUses > 0 && subscription.coveredServiceIds.includes(appointment.serviceId);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-sucesso-bg text-sucesso">
        <Check className="size-7" aria-hidden="true" />
      </div>
      <h1 className="mt-4 text-center text-2xl font-bold tracking-tight">Horário marcado</h1>
      <p className="mt-1 text-center text-sm text-texto-2">Tudo certo, {name.split(" ")[0]}. Nos vemos na barbearia.</p>

      <section aria-label="Detalhes do agendamento" className="mt-6 overflow-hidden rounded-card border border-borda bg-superficie">
        <div className="bg-marinho px-4 py-4 text-white">
          <p className="text-sm text-white/75">{formatLongDate(appointment.startsAt)}</p>
          <p className="num text-2xl font-bold">
            {formatTime(appointment.startsAt)} às {formatTime(appointment.endsAt)}
          </p>
        </div>
        <dl className="divide-y divide-borda px-4 text-sm">
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-texto-2">Barbeiro</dt>
            <dd className="flex items-center gap-2 font-semibold">
              <Avatar name={appointment.barberName} src={barberPhoto} size="sm" />
              {appointment.barberName}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-texto-2">Serviço</dt>
            <dd className="font-semibold">
              {appointment.serviceName} · {appointment.durationMin} min
            </dd>
          </div>
          {location && (
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-texto-2">Local</dt>
              <dd className="text-right font-semibold">{location}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-texto-2">Valor</dt>
            <dd className="num text-right font-semibold">
              {covered ? (
                <>
                  {formatBRL(0)} <s className="font-normal text-texto-2">{formatBRL(appointment.servicePrice)}</s>
                  <small className="block font-medium text-texto-2">
                    {subscription.planName} · restam {subscription.remainingUses} de {subscription.totalUses} até {formatLocalDate(subscription.cycleEnd)}
                  </small>
                </>
              ) : (
                formatBRL(appointment.servicePrice)
              )}
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-6 flex flex-col gap-2">
        <LinkButton href="/minha-conta" size="lg">
          <Calendar />
          Ver meus agendamentos
        </LinkButton>
        {shop?.whatsapp && (
          <a href={whatsappLink(shop.whatsapp)} target="_blank" rel="noreferrer" className={buttonClass("secondary", "lg")}>
            <MessageCircle />
            Falar no WhatsApp
          </a>
        )}
      </div>
    </main>
  );
}
