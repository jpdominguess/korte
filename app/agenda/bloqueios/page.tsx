import type { Metadata } from "next";
import { formatShortDate, formatTime } from "@/domain/shared/format";
import { addDays, localToInstant, toLocalDate } from "@/domain/shared/time";
import { useCases } from "@/infrastructure/container";
import { ConfirmButton } from "~/_components/confirm-button";
import { Card, EmptyState, PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";
import { getManagedBarbers } from "../managed-barbers";
import { BlockForm } from "./block-form";

export const metadata: Metadata = { title: "Bloqueios" };

const DAYS_AHEAD = 120;

export default async function BloqueiosPage() {
  const { user } = await requireSession(["OWNER", "BARBER"]);
  const now = new Date();
  const barbers = await getManagedBarbers(user);
  const today = toLocalDate(now);
  const { blocks } = await useCases.getAgenda.execute(user, {
    from: now,
    to: localToInstant(addDays(today, DAYS_AHEAD), 0),
  });
  const nameOf = (id: string) => barbers.find((b) => b.id === id)?.name ?? "";

  return (
    <>
      <PageHeader title="Bloqueios de agenda" subtitle="Períodos em que não é possível agendar." />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {barbers.length > 0 ? (
          <BlockForm barbers={barbers} />
        ) : (
          <Card>
            <EmptyState title="Nenhuma agenda disponível" />
          </Card>
        )}
        <Card>
          <h2 className="border-b border-borda px-4 py-3 font-bold lg:px-6">Próximos bloqueios</h2>
          {blocks.length === 0 ? (
            <EmptyState title="Nenhum bloqueio previsto" />
          ) : (
            <ul>
              {blocks.map((block) => (
                <li key={block.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-borda px-4 py-3 last:border-b-0 lg:px-6">
                  <div className="min-w-0">
                    <p className="font-semibold">{block.reason || "Bloqueado"}</p>
                    <p className="num text-sm text-texto-2">
                      {user.isOwner() && `${nameOf(block.barberProfileId)} · `}
                      {formatShortDate(block.startsAt)} {formatTime(block.startsAt)} até {formatShortDate(block.endsAt)} {formatTime(block.endsAt)}
                    </p>
                  </div>
                  <ConfirmButton url={`/api/bloqueios/${block.id}`} method="DELETE" label="Remover" confirmLabel="Confirmar remoção" />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
