import { blockSchema } from "@/application/schemas";
import { localToInstant, timeToMinutes } from "@/domain/shared/time";
import { useCases } from "@/infrastructure/container";
import { handler, loggedIn, readBody } from "../_lib/handler";

function toInstant(localDateTime: string) {
  const [date, time] = localDateTime.split("T");
  return localToInstant(date, timeToMinutes(time));
}

export const POST = handler(async ({ request, user }) => {
  const actor = loggedIn(user);
  const input = await readBody(request, blockSchema);
  return {
    id: await useCases.createScheduleBlock.execute(actor, {
      barberProfileId: input.barberProfileId,
      startsAt: toInstant(input.startsAt),
      endsAt: toInstant(input.endsAt),
      reason: input.reason,
    }),
  };
});
