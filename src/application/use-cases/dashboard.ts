import type { User } from "@/domain/entities/user";
import { addDays, addMonths, currentMonth, lastDayOfMonth, localToInstant, toLocalDate } from "@/domain/shared/time";
import type { OwnerDashboardDTO } from "../dto";
import type { DashboardRepository } from "../ports";

const CHART_DAYS = 14;

export class GetOwnerDashboard {
  constructor(private readonly dashboard: DashboardRepository) {}

  async execute(actor: User, requestedMonth?: string, now = new Date()): Promise<OwnerDashboardDTO> {
    actor.assertOwner();

    const today = toLocalDate(now);
    const month = requestedMonth && requestedMonth <= currentMonth(now) ? requestedMonth : currentMonth(now);
    const firstDay = `${month}-01`;
    const lastDay = lastDayOfMonth(month);
    const periodEnd = today < lastDay ? today : lastDay;
    const chartStart = addDays(periodEnd, -(CHART_DAYS - 1));

    const from = localToInstant(firstDay, 0);
    const to = localToInstant(`${addMonths(month, 1)}-01`, 0);
    const earliest = localToInstant(chartStart < firstDay ? chartStart : firstDay, 0);

    const [payments, completed, activeSubscriptions] = await Promise.all([
      this.dashboard.listPayments(earliest, to),
      this.dashboard.listCompleted(from, to),
      this.dashboard.countActiveSubscriptions(today),
    ]);

    const inMonth = payments.filter((p) => p.paidAt >= from && p.paidAt < to);
    const fromAppointments = inMonth.filter((p) => p.origin === "APPOINTMENT");
    const fromSubscriptions = inMonth.filter((p) => p.origin !== "APPOINTMENT");
    const sum = (list: Array<{ amount: number }>) => list.reduce((total, p) => total + p.amount, 0);

    const daily = Array.from({ length: CHART_DAYS }, (_, index) => {
      const date = addDays(chartStart, index);
      return { date, amount: sum(payments.filter((p) => toLocalDate(p.paidAt) === date)) };
    });
    const openDays = daily.filter((d) => d.amount > 0);
    const best = openDays.reduce<(typeof daily)[number] | null>((top, d) => (!top || d.amount > top.amount ? d : top), null);

    const barberIds = [...new Set(completed.map((c) => c.barberProfileId))];
    const barbers = barberIds
      .map((id) => {
        const attended = completed.filter((c) => c.barberProfileId === id);
        return {
          id,
          name: attended[0].barberName,
          completed: attended.length,
          share: attended.length / completed.length,
          revenue: sum(fromAppointments.filter((p) => p.barberProfileId === id)),
        };
      })
      .sort((a, b) => b.completed - a.completed);

    return {
      month,
      periodEnd,
      revenue: { total: sum(inMonth), appointments: sum(fromAppointments), subscriptions: sum(fromSubscriptions) },
      completed: {
        total: completed.length,
        paid: completed.filter((c) => !c.covered).length,
        covered: completed.filter((c) => c.covered).length,
      },
      subscriptions: { active: activeSubscriptions, paymentsInMonth: fromSubscriptions.length },
      daily,
      chartTotal: sum(daily),
      averagePerOpenDay: openDays.length ? sum(openDays) / openDays.length : 0,
      bestDay: best,
      barbers,
    };
  }
}
