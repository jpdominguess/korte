import { User, type Role } from "@/domain/entities/user";
import { prisma } from "../prisma/client";
import { auth } from "./auth";

export interface SessionUser {
  user: User;
  name: string;
  email: string;
  /** Foto cadastrada em Equipe; só quem atende tem. */
  photoUrl: string | null;
}

export async function loadSessionUser(headers: Headers): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;

  const profile = await prisma.barberProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return {
    user: new User(session.user.id, session.user.role as Role, profile?.id ?? null),
    name: session.user.name,
    email: session.user.email,
    photoUrl: profile && session.user.image ? `/api/barbeiros/${profile.id}/foto?v=${new Date(session.user.updatedAt).getTime()}` : null,
  };
}
