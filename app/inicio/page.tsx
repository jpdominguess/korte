import { redirect } from "next/navigation";
import { homeFor, requireSession } from "~/_lib/session";

export default async function InicioPage() {
  const session = await requireSession();
  redirect(homeFor(session.user));
}
