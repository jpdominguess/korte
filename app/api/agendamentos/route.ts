import { agendaQuerySchema, appointmentSchema } from "@/application/schemas";
import { addDays, localToInstant } from "@/domain/shared/time";
import { useCases } from "@/infrastructure/container";
import { handler, loggedIn, readBody } from "../_lib/handler";

export const GET = handler(async ({ request, user }) => {
  const actor = loggedIn(user);
  const query = agendaQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return useCases.getAgenda.execute(actor, {
    from: localToInstant(query.data, 0),
    to: localToInstant(addDays(query.data, query.dias), 0),
    barberProfileId: query.barbeiro,
  });
});

export const POST = handler(async ({ request, user }) => {
  const actor = loggedIn(user);
  const input = await readBody(request, appointmentSchema);
  return { id: await useCases.createAppointment.execute(actor, input) };
});
