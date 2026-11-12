import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { DomainError, type ErrorKind } from "@/domain/shared/errors";
import type { User } from "@/domain/entities/user";
import { loadSessionUser } from "@/infrastructure/auth/session";

const statusByKind: Record<ErrorKind, number> = {
  validation: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
};

interface Context<P> {
  request: Request;
  params: P;
  user: User | null;
}

export function handler<P = unknown>(action: (context: Context<P>) => Promise<unknown>) {
  return async (request: Request, segment: { params: Promise<P> }) => {
    try {
      const session = await loadSessionUser(request.headers);
      const result = await action({ request, params: await segment.params, user: session?.user ?? null });
      return NextResponse.json(result ?? { ok: true });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function loggedIn(user: User | null): User {
  if (!user) throw new DomainError("Entre na sua conta para continuar.", "unauthorized");
  return user;
}

export async function readBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const body = await request.json().catch(() => {
    throw new DomainError("Dados inválidos.");
  });
  return schema.parse(body);
}

function errorResponse(error: unknown) {
  if (error instanceof DomainError) {
    const body = error.details === undefined ? { error: error.message } : { error: error.message, details: error.details };
    return NextResponse.json(body, { status: statusByKind[error.kind] });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
}
