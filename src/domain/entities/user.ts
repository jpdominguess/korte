import { forbidden } from "../shared/errors";

export type Role = "OWNER" | "BARBER" | "CLIENT";

export class User {
  constructor(
    readonly id: string,
    readonly role: Role,
    readonly barberProfileId: string | null,
  ) {}

  isOwner(): boolean {
    return this.role === "OWNER";
  }

  isClient(): boolean {
    return this.role === "CLIENT";
  }

  isStaff(): boolean {
    return this.role === "OWNER" || this.role === "BARBER";
  }

  /** Dono opera qualquer agenda; barbeiro, apenas a própria. */
  canManage(target: { barberProfileId: string }): boolean {
    return this.isOwner() || this.barberProfileId === target.barberProfileId;
  }

  assertOwner(): void {
    if (!this.isOwner()) throw forbidden();
  }

  assertClient(): void {
    if (!this.isClient()) throw forbidden();
  }

  assertStaff(): void {
    if (!this.isStaff()) throw forbidden();
  }

  assertCanManage(target: { barberProfileId: string }): void {
    if (!this.canManage(target)) throw forbidden();
  }
}
