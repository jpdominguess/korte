import { AppShell } from "~/_components/app-shell";
import { requireSession } from "~/_lib/session";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["OWNER"]);
  return <AppShell session={session}>{children}</AppShell>;
}
