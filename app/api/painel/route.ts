import { useCases } from "@/infrastructure/container";
import { handler, loggedIn } from "../_lib/handler";

export const GET = handler(async ({ request, user }) => {
  const month = new URL(request.url).searchParams.get("mes");
  return useCases.getOwnerDashboard.execute(loggedIn(user), month && /^\d{4}-\d{2}$/.test(month) ? month : undefined);
});
