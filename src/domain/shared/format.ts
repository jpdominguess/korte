import { addDays, TIME_ZONE } from "./time";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(value: number): string {
  return brl.format(value);
}

const timeFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });
const longDateFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const shortDateFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
});

export function formatTime(instant: Date): string {
  return timeFormat.format(instant);
}

export function formatLongDate(instant: Date): string {
  const text = longDateFormat.format(instant);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatShortDate(instant: Date): string {
  return shortDateFormat.format(instant).replace(".", "");
}

/** Converte uma data local (YYYY-MM-DD) em DD/MM/AAAA. */
export function formatLocalDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

/** Nome do mês (YYYY-MM) por extenso, ex.: "Novembro de 2026". */
export function formatMonth(month: string): string {
  const text = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(`${month}-15T12:00:00Z`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Link wa.me a partir do número cadastrado; números sem DDI recebem o 55 do Brasil. */
export function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Semana que começa na data local informada, ex.: "Semana de 9 a 15 de novembro". */
export function formatWeekRange(start: string): string {
  const end = addDays(start, 6);
  const month = (date: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "long" }).format(new Date(`${date}T12:00:00Z`));
  const day = (date: string) => Number(date.slice(8));
  return month(start) === month(end)
    ? `Semana de ${day(start)} a ${day(end)} de ${month(end)}`
    : `Semana de ${day(start)} de ${month(start)} a ${day(end)} de ${month(end)}`;
}
