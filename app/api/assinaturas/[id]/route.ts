import { subscriptionActionSchema } from "@/application/schemas";
import { useCases } from "@/infrastructure/container";
import { handler, loggedIn, readBody } from "../../_lib/handler";

export const PUT = handler<{ id: string }>(async ({ request, params, user }) => {
  const actor = loggedIn(user);
  const input = await readBody(request, subscriptionActionSchema);
  if (input.action === "cancelar") await useCases.cancelSubscription.execute(actor, params.id);
  else await useCases.renewSubscription.execute(actor, params.id, input);
});
