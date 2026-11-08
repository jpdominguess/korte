import { DomainError, forbidden, notFound } from "@/domain/shared/errors";
import type { User } from "@/domain/entities/user";
import type { AppointmentRepository, NewScheduleBlock, ScheduleBlockRepository } from "../ports";

export class CreateScheduleBlock {
  constructor(
    private readonly blocks: ScheduleBlockRepository,
    private readonly appointments: AppointmentRepository,
  ) {}

  async execute(actor: User, input: NewScheduleBlock) {
    actor.assertStaff();
    actor.assertCanManage(input);
    if (input.endsAt <= input.startsAt) throw new DomainError("O fim do bloqueio deve ser depois do início.");

    const busy = await this.appointments.listBusyRanges(input.barberProfileId, input.startsAt, input.endsAt);
    if (busy.length > 0) {
      throw new DomainError("Há agendamentos nesse período. Cancele-os antes de bloquear.", "conflict");
    }
    return this.blocks.create(input);
  }
}

export class DeleteScheduleBlock {
  constructor(private readonly blocks: ScheduleBlockRepository) {}

  async execute(actor: User, id: string) {
    const block = await this.blocks.findById(id);
    if (!block) throw notFound("Bloqueio");
    if (!actor.isStaff() || !actor.canManage(block)) throw forbidden();
    await this.blocks.delete(id);
  }
}
