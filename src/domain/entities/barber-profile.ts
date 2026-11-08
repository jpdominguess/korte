export class BarberProfile {
  constructor(
    readonly id: string,
    readonly active: boolean,
    private readonly serviceIds: string[],
  ) {}

  performs(serviceId: string): boolean {
    return this.serviceIds.includes(serviceId);
  }

  /** RN01: precisa estar ativo e associado ao serviço. */
  canAttend(serviceId: string): boolean {
    return this.active && this.performs(serviceId);
  }
}
