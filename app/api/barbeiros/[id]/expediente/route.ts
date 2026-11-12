import { workScheduleSchema } from "@/application/schemas";
import { timeToMinutes } from "@/domain/shared/time";
import { useCases } from "@/infrastructure/container";
import { handler, loggedIn, readBody } from "../../../_lib/handler";

export const PUT = handler<{ id: string }>(async ({ request, params, user }) => {
  const actor = loggedIn(user);
  const { intervals, cancelConflicts } = await readBody(request, workScheduleSchema);
  await useCases.setWorkSchedule.execute(
    actor,
    params.id,
    intervals.map((i) => ({ weekday: i.weekday, startMin: timeToMinutes(i.start), endMin: timeToMinutes(i.end) })),
    { cancelConflicts },
  );
});
