import { serviceSchema } from "@/application/schemas";
import { useCases } from "@/infrastructure/container";
import { handler, loggedIn, readBody } from "../_lib/handler";

export const GET = handler(async () => useCases.listServices.execute({ onlyActive: true }));

export const POST = handler(async ({ request, user }) => {
  const actor = loggedIn(user);
  const { barberIds, ...props } = await readBody(request, serviceSchema);
  return { id: await useCases.createService.execute(actor, props, barberIds) };
});
