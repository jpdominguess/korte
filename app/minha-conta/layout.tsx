import Link from "next/link";
import { LogoutButton } from "~/_components/app-nav";
import { requireSession } from "~/_lib/session";

export default async function MinhaContaLayout({ children }: { children: React.ReactNode }) {
  await requireSession(["CLIENT"]);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-borda bg-superficie">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
          <Link href="/" className="font-marca text-2xl text-marinho no-underline">
            Korte
          </Link>
          <LogoutButton className="inline-flex h-9 items-center gap-2 rounded-controle px-2 text-sm font-semibold text-marinho hover:bg-muted" />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-5 lg:py-8">{children}</main>
    </div>
  );
}
