import type { User } from "@/domain/entities/user";
import type { BarbershopData, BarbershopRepository } from "../ports";

export class GetBarbershop {
  constructor(private readonly barbershops: BarbershopRepository) {}

  execute() {
    return this.barbershops.get();
  }
}

export class UpdateBarbershop {
  constructor(private readonly barbershops: BarbershopRepository) {}

  async execute(actor: User, data: BarbershopData) {
    actor.assertOwner();
    await this.barbershops.update(data);
  }
}
