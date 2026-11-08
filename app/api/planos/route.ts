import { planSchema } from "@/application/schemas";
import { useCases } from "@/infrastructure/container";
import { handler, loggedIn, readBody } from "../_lib/handler";

export const GET = handler(async () => useCases.listPlans.execute({ onlyActive: true }));

export const POST = handler(async ({ request, user }) => {
  const actor = loggedIn(user);
  const input = await readBody(request, planSchema);
  return { id: await useCases.createPlan.execute(actor, input) };
});
