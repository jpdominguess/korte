import { useCases } from "@/infrastructure/container";
import { handler } from "../_lib/handler";

export const GET = handler(async () => useCases.getPublicPage.execute());
