import type { WorkInterval } from "@/domain/entities/work-schedule";
import { minutesOfDay, toLocalDate, weekdayOf } from "@/domain/shared/time";
import type { PublicPageDTO } from "../dto";
import type { BarberRepository, BarbershopRepository, PlanRepository, ServiceRepository, WorkScheduleRepository } from "../ports";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function hourLabel(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return minute ? `${hour}h${String(minute).padStart(2, "0")}` : `${hour}h`;
}

/** Resume o funcionamento a partir dos expedientes da equipe (ex.: "Ter a Sáb, das 9h às 19h"). */
function describeOpeningHours(intervals: WorkInterval[]): string | null {
  if (intervals.length === 0) return null;
  const days = [...new Set(intervals.map((i) => i.weekday))].sort();
  const contiguous = days.every((day, index) => index === 0 || day === days[index - 1] + 1);
  const dayLabel =
    contiguous && days.length > 1
      ? `${WEEKDAYS[days[0]]} a ${WEEKDAYS[days[days.length - 1]]}`
      : days.map((day) => WEEKDAYS[day]).join(", ");
  const start = Math.min(...intervals.map((i) => i.startMin));
  const end = Math.max(...intervals.map((i) => i.endMin));
  return `${dayLabel}, das ${hourLabel(start)} às ${hourLabel(end)}`;
}

export class GetPublicPage {
  constructor(
    private readonly barbershops: BarbershopRepository,
    private readonly services: ServiceRepository,
    private readonly barbers: BarberRepository,
    private readonly workSchedules: WorkScheduleRepository,
    private readonly plans: PlanRepository,
  ) {}

  async execute(now = new Date()): Promise<PublicPageDTO> {
    const [barbershop, services, barbers, intervals, plans] = await Promise.all([
      this.barbershops.get(),
      this.services.list({ onlyActive: true }),
      this.barbers.list({ onlyActive: true }),
      this.workSchedules.listAll(),
      this.plans.list({ onlyActive: true }),
    ]);

    const activeIds = new Set(barbers.map((barber) => barber.id));
    const activeIntervals = intervals.filter((i) => activeIds.has(i.barberProfileId));
    const weekday = weekdayOf(toLocalDate(now));
    const minute = minutesOfDay(now);

    return {
      barbershop,
      services: services.map((service) => ({
        ...service,
        barberIds: service.barberIds.filter((id) => activeIds.has(id)),
      })),
      barbers: barbers.map((barber) => ({
        id: barber.id,
        name: barber.name,
        serviceIds: barber.serviceIds,
        workdays: [...new Set(activeIntervals.filter((i) => i.barberProfileId === barber.id).map((i) => i.weekday))],
      })),
      plans: plans.map(({ id, name, price, usesPerCycle, active, serviceIds, serviceNames }) => ({ id, name, price, usesPerCycle, active, serviceIds, serviceNames })),
      openingHours: describeOpeningHours(activeIntervals),
      openNow: activeIntervals.some((i) => i.weekday === weekday && i.startMin <= minute && minute < i.endMin),
    };
  }
}
