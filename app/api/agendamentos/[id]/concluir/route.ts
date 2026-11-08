import { completeSchema } from "@/application/schemas";
import { useCases } from "@/infrastructure/container";
import { handler, loggedIn, readBody } from "../../../_lib/handler";

export const POST = handler<{ id: string }>(async ({ request, params, user }) => {
  const actor = loggedIn(user);
  const input = await readBody(request, completeSchema);
  await useCases.completeAppointment.execute(actor, params.id, input);
});
