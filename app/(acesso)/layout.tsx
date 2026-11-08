import Link from "next/link";

export default function AcessoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="hidden flex-col justify-between bg-marinho p-12 text-white lg:flex">
        <Link href="/" className="font-marca text-4xl text-white no-underline">
          Korte
        </Link>
        <div className="max-w-md">
          <h1 className="font-marca text-4xl leading-tight text-balance">
            Agenda, atendimentos e assinaturas da barbearia em um só lugar.
          </h1>
          <p className="mt-4 text-white/75">
            Os horários da equipe, os atendimentos do dia e os planos dos clientes no mesmo painel, no computador ou no celular.
          </p>
        </div>
        <p className="text-sm text-white/60">© 2026 Korte</p>
      </aside>
      <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
        <Link href="/" className="mb-8 font-marca text-4xl text-marinho no-underline lg:hidden">
          Korte
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
