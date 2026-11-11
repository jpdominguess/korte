import type { WorkInterval } from "@/domain/entities/work-schedule";
import { addDays, minutesOfDay, toLocalDate, weekdayOf } from "@/domain/shared/time";
import type { PublicPageDTO } from "../dto";
import type { BarberRepository, BarbershopRepository, PlanRepository, ServiceRepository, WorkScheduleRepository } from "../ports";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

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

/** Próxima mudança de estado: até que horas fica aberto ou quando abre de novo. */
function describeStatus(intervals: WorkInterval[], today: string, minute: number): string | null {
  const todays = intervals.filter((i) => i.weekday === weekdayOf(today));
  if (todays.some((i) => i.startMin <= minute && minute < i.endMin)) {
    let end = minute;
    for (let grew = true; grew; ) {
      grew = false;
      for (const i of todays) {
        if (i.startMin <= end && i.endMin > end) {
          end = i.endMin;
          grew = true;
        }
      }
    }
    return `Fecha às ${hourLabel(end)}`;
  }
  for (let offset = 0; offset <= 7; offset++) {
    const day = addDays(today, offset);
    const starts = intervals.filter((i) => i.weekday === weekdayOf(day) && (offset > 0 || i.startMin > minute)).map((i) => i.startMin);
    if (starts.length > 0) {
      const when = offset === 0 ? "hoje" : offset === 1 ? "amanhã" : WEEKDAY_NAMES[weekdayOf(day)];
      return `Abre ${when} às ${hourLabel(Math.min(...starts))}`;
    }
  }
  return null;
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
    const today = toLocalDate(now);
    const weekday = weekdayOf(today);
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
        photoUrl: barber.photoUrl,
        serviceIds: barber.serviceIds,
        workdays: [...new Set(activeIntervals.filter((i) => i.barberProfileId === barber.id).map((i) => i.weekday))],
      })),
      plans: plans.map(({ id, name, price, usesPerCycle, active, serviceIds, serviceNames }) => ({ id, name, price, usesPerCycle, active, serviceIds, serviceNames })),
      openingHours: describeOpeningHours(activeIntervals),
      openNow: activeIntervals.some((i) => i.weekday === weekday && i.startMin <= minute && minute < i.endMin),
      statusDetail: describeStatus(activeIntervals, today, minute),
    };
  }
}
