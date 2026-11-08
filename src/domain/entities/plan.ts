import { DomainError } from "../shared/errors";

export interface PlanProps {
  name: string;
  price: number;
  usesPerCycle: number;
  active: boolean;
  serviceIds: string[];
}

export class Plan {
  readonly name: string;
  readonly price: number;
  readonly usesPerCycle: number;
  readonly active: boolean;
  readonly serviceIds: string[];

  constructor(props: PlanProps) {
    if (!props.name.trim()) throw new DomainError("Informe o nome do plano.");
    if (props.price < 0) throw new DomainError("O preço não pode ser negativo.");
    if (!Number.isInteger(props.usesPerCycle) || props.usesPerCycle <= 0) {
      throw new DomainError("Informe quantos usos o plano dá por ciclo.");
    }
    if (props.serviceIds.length === 0) throw new DomainError("Escolha ao menos um serviço incluído.");

    this.name = props.name.trim();
    this.price = props.price;
    this.usesPerCycle = props.usesPerCycle;
    this.active = props.active;
    this.serviceIds = props.serviceIds;
  }

  covers(serviceId: string): boolean {
    return this.serviceIds.includes(serviceId);
  }
}
