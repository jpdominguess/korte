import { serviceSchema } from "@/application/schemas";
import { useCases } from "@/infrastructure/container";
import { handler, loggedIn, readBody } from "../../_lib/handler";

export const PUT = handler<{ id: string }>(async ({ request, params, user }) => {
  const actor = loggedIn(user);
  const { barberIds, ...props } = await readBody(request, serviceSchema);
  await useCases.updateService.execute(actor, params.id, props, barberIds);
});
