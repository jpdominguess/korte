import type { Metadata } from "next";
import Link from "next/link";
import { useCases } from "@/infrastructure/container";
import { Card, EmptyState, PageHeader } from "~/_components/ui";
import { requireSession } from "~/_lib/session";
import { ScheduleForm } from "./schedule-form";

export const metadata: Metadata = { title: "Expedientes" };

export default async function ExpedientesPage({ searchParams }: { searchParams: Promise<{ barbeiro?: string }> }) {
  const { user } = await requireSession(["OWNER"]);
  const { barbeiro } = await searchParams;
  const barbers = await useCases.listBarbers.execute(user);
  const selected = barbers.find((b) => b.id === barbeiro) ?? barbers[0];
  const intervals = selected ? await useCases.getWorkSchedule.execute(user, selected.id) : [];

  return (
    <>
      <PageHeader title="Expedientes" subtitle="Dias e horários em que cada profissional atende." />
      {!selected ? (
        <Card>
          <EmptyState title="Nenhum barbeiro cadastrado" text="Cadastre a equipe para definir os expedientes." />
        </Card>
      ) : (
        <>
          <nav aria-label="Escolher barbeiro" className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {barbers.map((barber) => (
              <Link
                key={barber.id}
                href={`/painel/expedientes?barbeiro=${barber.id}`}
                aria-current={barber.id === selected.id ? "true" : undefined}
                className={`inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-sm font-semibold no-underline ${barber.id === selected.id ? "border-marinho bg-marinho text-white" : "border-borda-controle bg-superficie text-marinho hover:bg-muted"}`}
              >
                {barber.name}
              </Link>
            ))}
          </nav>
          <ScheduleForm key={selected.id} barberId={selected.id} intervals={intervals} />
        </>
      )}
    </>
  );
}
