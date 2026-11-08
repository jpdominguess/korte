import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "@/domain/entities/user";
import { loadSessionUser } from "@/infrastructure/auth/session";

export const getSession = cache(async () => loadSessionUser(await headers()));

export function homeFor(user: User) {
  if (user.isOwner()) return "/painel";
  return user.isClient() ? "/minha-conta" : "/agenda";
}

/** Verifica no servidor se há sessão e se o perfil pode abrir a página. */
export async function requireSession(roles?: Role[], next?: string) {
  const session = await getSession();
  if (!session) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  if (roles && !roles.includes(session.user.role)) redirect(homeFor(session.user));
  return session;
}
