import { useCases } from "@/infrastructure/container";
import { handler, loggedIn } from "../../_lib/handler";

export const POST = handler(async ({ user }) => ({
  id: await useCases.enableOwnerBarberProfile.execute(loggedIn(user)),
}));
