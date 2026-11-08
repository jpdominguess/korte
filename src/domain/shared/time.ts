export const TIME_ZONE = "America/Sao_Paulo";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function localParts(instant: Date) {
  const parts = Object.fromEntries(partsFormatter.formatToParts(instant).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Data local (YYYY-MM-DD) de um instante, no fuso da barbearia. */
export function toLocalDate(instant: Date): string {
  const { year, month, day } = localParts(instant);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function minutesOfDay(instant: Date): number {
  const { hour, minute } = localParts(instant);
  return hour * 60 + minute;
}

/** Instante correspondente a uma data local e aos minutos desde a meia-noite. */
export function localToInstant(date: string, minutes: number): Date {
  const [year, month, day] = date.split("-").map(Number);
  const asUtc = Date.UTC(year, month - 1, day, 0, minutes);
  const p = localParts(new Date(asUtc));
  const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - asUtc;
  return new Date(asUtc - offset);
}

export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function currentMonth(now: Date): string {
  return toLocalDate(now).slice(0, 7);
}

/** Soma meses a um mês no formato YYYY-MM. */
export function addMonths(month: string, count: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const d = new Date(Date.UTC(year, monthNumber - 1 + count, 1));
  return d.toISOString().slice(0, 7);
}

export function lastDayOfMonth(month: string): string {
  return addDays(`${addMonths(month, 1)}-01`, -1);
}

export function isLocalDate(value: string | undefined | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
}

export function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
