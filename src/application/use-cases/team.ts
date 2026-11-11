import { notFound } from "@/domain/shared/errors";
import type { User } from "@/domain/entities/user";
import type { AccountService, BarberRepository, BarberUpdate } from "../ports";

export class ListBarbers {
  constructor(private readonly barbers: BarberRepository) {}

  execute(actor: User) {
    actor.assertOwner();
    return this.barbers.list();
  }
}

/** Barbeiros cuja agenda o usuário pode operar. */
export class GetManagedBarbers {
  constructor(private readonly barbers: BarberRepository) {}

  async execute(actor: User) {
    actor.assertStaff();
    const all = await this.barbers.list();
    return actor.isOwner() ? all : all.filter((barber) => barber.id === actor.barberProfileId);
  }
}

export interface NewBarber {
  name: string;
  email: string;
  phone: string | null;
  password: string;
  serviceIds: string[];
  photo?: string | null;
}

export class CreateBarber {
  constructor(
    private readonly barbers: BarberRepository,
    private readonly accounts: AccountService,
  ) {}

  async execute(actor: User, input: NewBarber) {
    actor.assertOwner();
    const userId = await this.accounts.createCredentialAccount({
      name: input.name,
      email: input.email,
      phone: input.phone,
      password: input.password,
      role: "BARBER",
    });
    const id = await this.barbers.create(userId, input.serviceIds);
    if (input.photo) await this.barbers.setPhoto(id, input.photo);
    return id;
  }
}

export class UpdateBarber {
  constructor(private readonly barbers: BarberRepository) {}

  async execute(actor: User, id: string, data: BarberUpdate) {
    actor.assertOwner();
    if (!(await this.barbers.findById(id))) throw notFound("Barbeiro");
    await this.barbers.update(id, data);
    if (data.photo !== undefined) await this.barbers.setPhoto(id, data.photo);
  }
}

/** Foto pública do barbeiro, guardada como imagem embutida (data URL). */
export class GetBarberPhoto {
  constructor(private readonly barbers: BarberRepository) {}

  execute(id: string) {
    return this.barbers.getPhoto(id);
  }
}

/** O dono passa a atender usando a própria conta. */
export class EnableOwnerBarberProfile {
  constructor(private readonly barbers: BarberRepository) {}

  async execute(actor: User) {
    actor.assertOwner();
    const existing = await this.barbers.findByUserId(actor.id);
    if (!existing) return this.barbers.create(actor.id, []);
    await this.barbers.setActive(existing.id, true);
    return existing.id;
  }
}
