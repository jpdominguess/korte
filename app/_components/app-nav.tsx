"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CalendarPlus,
  CircleUser,
  Clock,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Repeat,
  Scissors,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/domain/entities/user";
import { authClient } from "~/_lib/auth-client";

interface Item {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface Group {
  title?: string;
  items: Item[];
}

function sidebarGroups(role: Role, hasBarberProfile: boolean): Group[] {
  const ownAgenda: Item[] = [
    { href: "/agenda", label: "Minha agenda", icon: Calendar },
    { href: "/agenda/novo", label: "Novo agendamento", icon: CalendarPlus },
    { href: "/agenda/historico", label: "Atendimentos", icon: History },
  ];
  if (role === "BARBER") return [{ items: ownAgenda }];
  return [
    {
      title: "Dia a dia",
      items: [
        { href: "/painel", label: "Painel", icon: LayoutDashboard },
        { href: "/painel/agenda", label: "Agenda geral", icon: Calendar },
        { href: "/agenda/novo", label: "Novo agendamento", icon: CalendarPlus },
        ...(hasBarberProfile ? [{ href: "/agenda", label: "Minha agenda", icon: CircleUser }] : []),
      ],
    },
    {
      title: "Cadastros",
      items: [
        { href: "/painel/barbeiros", label: "Equipe", icon: Users },
        { href: "/painel/servicos", label: "Serviços", icon: Scissors },
        { href: "/painel/expedientes", label: "Expedientes", icon: Clock },
        { href: "/painel/planos", label: "Planos e assinaturas", icon: Repeat },
        { href: "/painel/barbearia", label: "Barbearia", icon: Store },
      ],
    },
  ];
}

function bottomItems(role: Role): Item[] {
  if (role === "BARBER") {
    return [
      { href: "/agenda", label: "Agenda", icon: Calendar },
      { href: "/agenda/novo", label: "Novo", icon: CalendarPlus },
      { href: "/agenda/historico", label: "Histórico", icon: History },
      { href: "/agenda/bloqueios", label: "Bloqueios", icon: Clock },
    ];
  }
  return [
    { href: "/painel", label: "Painel", icon: LayoutDashboard },
    { href: "/painel/agenda", label: "Agenda", icon: Calendar },
    { href: "/agenda/novo", label: "Novo", icon: CalendarPlus },
    { href: "/painel/mais", label: "Mais", icon: Menu },
  ];
}

function isActive(pathname: string, href: string) {
  if (href === "/painel" || href === "/agenda") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ role, hasBarberProfile }: { role: Role; hasBarberProfile: boolean }) {
  const pathname = usePathname();
  return (
    <>
      {sidebarGroups(role, hasBarberProfile).map((group, index) => (
        <div key={index} className="mb-6">
          {group.title && <p className="mb-2 px-3 text-xs font-semibold text-white/60">{group.title}</p>}
          <nav className="flex flex-col gap-0.5" aria-label={group.title ?? "Navegação principal"}>
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-10 items-center gap-3 rounded-controle px-3 text-sm font-semibold no-underline transition-colors hover:bg-marinho-hover hover:text-white ${active ? "bg-marinho-hover text-white" : "text-white/75"}`}
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </>
  );
}

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-borda bg-superficie pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {bottomItems(role).map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold no-underline ${active ? "text-marinho" : "text-texto-2"}`}
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  async function logout() {
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  }
  return (
    <button type="button" onClick={logout} className={className}>
      <LogOut className="size-4" aria-hidden="true" />
      Sair
    </button>
  );
}
