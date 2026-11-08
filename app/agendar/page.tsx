import type { Metadata } from "next";
import { toLocalDate } from "@/domain/shared/time";
import { useCases } from "@/infrastructure/container";
import { requireSession } from "~/_lib/session";
import { BookingFlow } from "./booking-flow";

export const metadata: Metadata = { title: "Agendar horário" };

export default async function AgendarPage() {
  await requireSession(["CLIENT"], "/agendar");
  const page = await useCases.getPublicPage.execute();

  return (
    <BookingFlow
      shopName={page.barbershop?.name ?? "Barbearia"}
      services={page.services.filter((service) => service.barberIds.length > 0)}
      barbers={page.barbers}
      today={toLocalDate(new Date())}
    />
  );
}
