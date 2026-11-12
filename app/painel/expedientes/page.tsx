import type { Metadata } from "next";
import { useCases } from "@/infrastructure/container";
import { BarberSelect } from "~/_components/barber-select";
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
          <BarberSelect barbers={barbers} value={selected.id} path="/painel/expedientes" />
          <ScheduleForm key={selected.id} barberId={selected.id} intervals={intervals} />
        </>
      )}
    </>
  );
}
