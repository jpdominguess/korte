import type { User } from "@/domain/entities/user";
import { useCases } from "@/infrastructure/container";

/** Agendas que o usuário pode operar: todas para o dono, a própria para o barbeiro. */
export async function getManagedBarbers(user: User) {
  const barbers = await useCases.getManagedBarbers.execute(user);
  return barbers.filter((barber) => barber.active);
}
