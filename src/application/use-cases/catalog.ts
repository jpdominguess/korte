import { Service, type ServiceProps } from "@/domain/entities/service";
import { notFound } from "@/domain/shared/errors";
import type { User } from "@/domain/entities/user";
import type { ServiceRepository } from "../ports";

export class ListServices {
  constructor(private readonly services: ServiceRepository) {}

  execute(filter?: { onlyActive?: boolean }) {
    return this.services.list(filter);
  }
}

export class CreateService {
  constructor(private readonly services: ServiceRepository) {}

  execute(actor: User, props: ServiceProps, barberIds: string[]) {
    actor.assertOwner();
    return this.services.create(new Service(props), barberIds);
  }
}

export class UpdateService {
  constructor(private readonly services: ServiceRepository) {}

  async execute(actor: User, id: string, props: ServiceProps, barberIds: string[]) {
    actor.assertOwner();
    if (!(await this.services.findById(id))) throw notFound("Serviço");
    await this.services.update(id, new Service(props), barberIds);
  }
}
