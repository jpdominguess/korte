import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { DomainError } from "@/domain/shared/errors";
import { formatBRL, formatLongDate, formatTime } from "@/domain/shared/format";
import { useCases } from "@/infrastructure/container";
import { Avatar, LinkButton } from "~/_components/ui";
import { requireSession } from "~/_lib/session";

export const metadata: Metadata = { title: "Horário marcado" };

export default async function ConfirmadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, name } = await requireSession(["CLIENT"]);
  const { id } = await params;
  const [shop, appointment] = await Promise.all([
    useCases.getBarbershop.execute(),
    useCases.getAppointmentDetails.execute(user, id).catch((error) => {
      if (error instanceof DomainError) notFound();
      throw error;
    }),
  ]);
  const location = shop && [shop.street, shop.number].filter(Boolean).join(", ");

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
              <Avatar name={appointment.barberName} size="xs" />
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
            <dd className="num font-semibold">{formatBRL(appointment.servicePrice)}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-6 flex flex-col gap-2">
        <LinkButton href="/" size="lg">
          Voltar para a barbearia
        </LinkButton>
      </div>
    </main>
  );
}
