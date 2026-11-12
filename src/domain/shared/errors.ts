export type ErrorKind = "validation" | "unauthorized" | "forbidden" | "not_found" | "conflict";

export class DomainError extends Error {
  constructor(
    message: string,
    readonly kind: ErrorKind = "validation",
    /** Dados extras para a tela, como a lista de agendamentos em conflito. */
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export const forbidden = () => new DomainError("Você não tem permissão para esta operação.", "forbidden");
export const notFound = (what: string) => new DomainError(`${what} não encontrado.`, "not_found");
