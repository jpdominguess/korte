import { useCases } from "@/infrastructure/container";
import { handler, loggedIn } from "../../../_lib/handler";

export const POST = handler<{ id: string }>(async ({ params, user }) => {
  await useCases.markNoShow.execute(loggedIn(user), params.id);
});
