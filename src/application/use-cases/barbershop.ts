import type { User } from "@/domain/entities/user";
import { DomainError } from "@/domain/shared/errors";
import type { AddressLookup, BarbershopData, BarbershopRepository } from "../ports";

export class GetBarbershop {
  constructor(private readonly barbershops: BarbershopRepository) {}

  execute() {
    return this.barbershops.get();
  }
}

export class LookupAddress {
  constructor(private readonly addresses: AddressLookup) {}

  execute(actor: User, cep: string) {
    actor.assertOwner();
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) throw new DomainError("O CEP deve ter 8 dígitos.");
    return this.addresses.findByCep(digits);
  }
}

export class UpdateBarbershop {
  constructor(private readonly barbershops: BarbershopRepository) {}

  async execute(actor: User, data: BarbershopData) {
    actor.assertOwner();
    await this.barbershops.update(data);
  }
}
