import { TIME_ZONE } from "./time";

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

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
