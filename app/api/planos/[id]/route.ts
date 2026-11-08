import { planSchema } from "@/application/schemas";
import { useCases } from "@/infrastructure/container";
import { handler, loggedIn, readBody } from "../../_lib/handler";

export const PUT = handler<{ id: string }>(async ({ request, params, user }) => {
  const actor = loggedIn(user);
  const input = await readBody(request, planSchema);
  await useCases.updatePlan.execute(actor, params.id, input);
});
