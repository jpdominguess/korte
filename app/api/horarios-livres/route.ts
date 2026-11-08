import { slotsQuerySchema } from "@/application/schemas";
import { useCases } from "@/infrastructure/container";
import { handler } from "../_lib/handler";

export const GET = handler(async ({ request }) => {
  const query = slotsQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return useCases.getAvailableSlots.execute({
    serviceId: query.servico,
    barberProfileId: query.barbeiro,
    date: query.data,
  });
});
