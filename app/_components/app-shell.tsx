import Link from "next/link";
import { useCases } from "@/infrastructure/container";
import type { SessionUser } from "@/infrastructure/auth/session";
import { BottomNav, LogoutButton, Sidebar } from "./app-nav";
import { Avatar } from "./ui";

const roleLabel = { OWNER: "Dono", BARBER: "Barbeiro", CLIENT: "Cliente" };

export async function AppShell({ session, children }: { session: SessionUser; children: React.ReactNode }) {
  const shop = await useCases.getBarbershop.execute();
  const { user, name } = session;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto bg-marinho px-4 pt-6 pb-4 text-white lg:flex">
        <Link href="/inicio" className="mb-8 block px-3 font-marca text-3xl leading-none text-white no-underline">
          Korte
        </Link>
        <Sidebar role={user.role} hasBarberProfile={!!user.barberProfileId} />
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col pb-20 lg:pb-0">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-borda bg-superficie px-4 lg:h-16 lg:px-8">
          <div className="min-w-0">
            <p className="truncate text-sm leading-tight font-bold">{shop?.name ?? "Korte"}</p>
            {shop?.city && <p className="truncate text-xs leading-tight text-texto-2">{shop.city}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Avatar name={name} src={session.photoUrl} size="md" dark />
            <div className="hidden sm:block">
              <p className="text-sm leading-tight font-semibold">{name}</p>
              <p className="text-xs leading-tight text-texto-2">{roleLabel[user.role]}</p>
            </div>
            <LogoutButton className="inline-flex h-9 items-center gap-2 rounded-controle px-2 text-sm font-semibold text-marinho hover:bg-muted" />
          </div>
        </header>
        <main className="flex-1 px-4 py-5 lg:px-8 lg:py-6">{children}</main>
      </div>

      <BottomNav role={user.role} />
    </div>
  );
}
