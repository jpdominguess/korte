import { DomainError } from "../shared/errors";

export type PaymentMethod = "CASH" | "PIX" | "DEBIT" | "CREDIT";
export type PaymentOrigin = "APPOINTMENT" | "ACTIVATION" | "RENEWAL";

export class Payment {
  constructor(
    readonly amount: number,
    readonly method: PaymentMethod,
    readonly origin: PaymentOrigin,
    readonly paidAt: Date,
  ) {
    if (amount < 0) throw new DomainError("O valor não pode ser negativo.");
  }
}
