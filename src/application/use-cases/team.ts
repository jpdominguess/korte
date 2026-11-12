import { DomainError, forbidden, notFound } from "@/domain/shared/errors";
import type { User } from "@/domain/entities/user";
import type { AccountService, BarberRepository, BarberUpdate, TeamRole, UnitOfWork } from "../ports";

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
  role?: TeamRole;
}

export class CreateBarber {
  constructor(private readonly accounts: AccountService) {}

  async execute(actor: User, input: NewBarber) {
    actor.assertOwner();
    return this.accounts.createBarberAccount({
      name: input.name,
      email: input.email,
      phone: input.phone,
      password: input.password,
      role: input.role ?? "BARBER",
      serviceIds: input.serviceIds,
      photo: input.photo,
    });
  }
}

export class UpdateBarber {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(actor: User, id: string, data: BarberUpdate) {
    actor.assertOwner();
    await this.unitOfWork.run(async ({ barbers }) => {
      const actingProfile = await barbers.findByUserId(actor.id);
      if (actingProfile && !actingProfile.isOwner) throw forbidden();
      const current = await barbers.findById(id);
      if (!current) throw notFound("Barbeiro");
      const roleChanged = data.role !== undefined && data.role !== (current.isOwner ? "OWNER" : "BARBER");
      if (roleChanged && current.userId === actor.id) throw new DomainError("Você não pode mudar o seu próprio cargo.");
      if (roleChanged && current.isOwner && data.role === "BARBER" && (await barbers.countOwners()) <= 1) {
        throw new DomainError("A barbearia precisa manter pelo menos um dono.", "conflict");
      }
      await barbers.update(id, data);
      if (roleChanged && data.role) await barbers.setRole(id, data.role);
      if (data.photo !== undefined) await barbers.setPhoto(id, data.photo);
    });
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
