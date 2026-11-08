import { newBarberSchema } from "@/application/schemas";
import { useCases } from "@/infrastructure/container";
import { handler, loggedIn, readBody } from "../_lib/handler";

export const GET = handler(async ({ user }) => useCases.listBarbers.execute(loggedIn(user)));

export const POST = handler(async ({ request, user }) => {
  const actor = loggedIn(user);
  const input = await readBody(request, newBarberSchema);
  return { id: await useCases.createBarber.execute(actor, input) };
});
