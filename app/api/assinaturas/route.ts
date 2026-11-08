import { activateSubscriptionSchema } from "@/application/schemas";
import { useCases } from "@/infrastructure/container";
import { handler, loggedIn, readBody } from "../_lib/handler";

export const GET = handler(async ({ user }) => useCases.listSubscriptions.execute(loggedIn(user)));

export const POST = handler(async ({ request, user }) => {
  const actor = loggedIn(user);
  const input = await readBody(request, activateSubscriptionSchema);
  return { id: await useCases.activateSubscription.execute(actor, input) };
});
