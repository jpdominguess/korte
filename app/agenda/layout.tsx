import { AppShell } from "~/_components/app-shell";
import { requireSession } from "~/_lib/session";

export default async function AgendaLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["OWNER", "BARBER"]);
  return <AppShell session={session}>{children}</AppShell>;
}
