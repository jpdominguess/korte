import { DomainError } from "../shared/errors";
import { addDays } from "../shared/time";

export type SubscriptionSituation = "ATIVA" | "CANCELADA" | "EXPIRADA";

export interface SubscriptionProps {
  id: string;
  clientId: string;
  planId: string;
  cycleStart: string;
  cycleEnd: string;
  totalUses: number;
  usedUses: number;
  canceledAt: Date | null;
}

export class Subscription {
  static readonly CYCLE_DAYS = 30;

  readonly id: string;
  readonly clientId: string;
  readonly planId: string;
  private start: string;
  private end: string;
  private total: number;
  private used: number;
  private canceled: Date | null;

  constructor(props: SubscriptionProps) {
    this.id = props.id;
    this.clientId = props.clientId;
    this.planId = props.planId;
    this.start = props.cycleStart;
    this.end = props.cycleEnd;
    this.total = props.totalUses;
    this.used = props.usedUses;
    this.canceled = props.canceledAt;
  }

  static firstCycle(today: string, usesPerCycle: number) {
    // O primeiro e o último dia fazem parte dos 30 dias de validade.
    return { cycleStart: today, cycleEnd: addDays(today, Subscription.CYCLE_DAYS - 1), totalUses: usesPerCycle, usedUses: 0 };
  }

  get cycleStart() {
    return this.start;
  }

  get cycleEnd() {
    return this.end;
  }

  get totalUses() {
    return this.total;
  }

  get usedUses() {
    return this.used;
  }

  get canceledAt() {
    return this.canceled;
  }

  get remainingUses() {
    return this.total - this.used;
  }

  situation(today: string): SubscriptionSituation {
    if (this.canceled) return "CANCELADA";
    return today > this.end ? "EXPIRADA" : "ATIVA";
  }

  isUsable(today: string): boolean {
    return today >= this.start && this.situation(today) === "ATIVA" && this.remainingUses > 0;
  }

  consumeUse(today: string): void {
    if (!this.isUsable(today)) throw new DomainError("A assinatura não tem usos disponíveis.", "conflict");
    this.used += 1;
  }

  /** RN07: novo ciclo de 30 dias a partir da data do registro, com usos zerados. */
  renew(today: string, usesPerCycle: number): void {
    if (this.canceled) throw new DomainError("Assinatura cancelada não pode ser renovada. Ative uma nova.");
    const cycle = Subscription.firstCycle(today, usesPerCycle);
    this.start = cycle.cycleStart;
    this.end = cycle.cycleEnd;
    this.total = cycle.totalUses;
    this.used = cycle.usedUses;
  }

  cancel(now: Date): void {
    if (this.canceled) throw new DomainError("Esta assinatura já foi cancelada.", "conflict");
    this.canceled = now;
  }
}
