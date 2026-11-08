import { useCases } from "@/infrastructure/container";
import { handler, loggedIn } from "../../_lib/handler";

export const DELETE = handler<{ id: string }>(async ({ params, user }) => {
  await useCases.deleteScheduleBlock.execute(loggedIn(user), params.id);
});
