import { DomainError } from "../shared/errors";

export interface ServiceProps {
  name: string;
  description: string | null;
  durationMin: number;
  price: number;
  active: boolean;
}

export class Service {
  private static readonly MAX_DURATION_MIN = 480;

  readonly name: string;
  readonly description: string | null;
  readonly durationMin: number;
  readonly price: number;
  readonly active: boolean;

  constructor(props: ServiceProps) {
    if (!props.name.trim()) throw new DomainError("Informe o nome do serviço.");
    if (!Number.isInteger(props.durationMin) || props.durationMin <= 0 || props.durationMin > Service.MAX_DURATION_MIN) {
      throw new DomainError("A duração deve ser um número de minutos entre 1 e 480.");
    }
    if (props.price < 0) throw new DomainError("O preço não pode ser negativo.");

    this.name = props.name.trim();
    this.description = props.description?.trim() || null;
    this.durationMin = props.durationMin;
    this.price = props.price;
    this.active = props.active;
  }
}
