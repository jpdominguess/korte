"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, LoaderCircle, X } from "lucide-react";
import type { ClientSubscriptionDTO, PublicBarberDTO, ServiceDTO } from "@/application/dto";
import { formatBRL, formatLocalDate, formatLongDate, formatTime } from "@/domain/shared/format";
import { addDays, localToInstant, minutesOfDay, weekdayOf } from "@/domain/shared/time";
import { Avatar, Button, FormError, Notice, buttonClass } from "~/_components/ui";
import { apiRequest } from "~/_lib/use-submit";

const STEPS = ["Serviço", "Barbeiro", "Horário", "Confirmar"];
const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const DAYS_AHEAD = 21;

const PERIODS = [
  { name: "Manhã", from: 0, to: 12 * 60 },
  { name: "Tarde", from: 12 * 60, to: 18 * 60 },
  { name: "Noite", from: 18 * 60, to: 24 * 60 },
];

interface Props {
  shopName: string;
  services: ServiceDTO[];
  barbers: PublicBarberDTO[];
  today: string;
  subscription: ClientSubscriptionDTO | null;
}

export function BookingFlow({ shopName, services, barbers, today, subscription }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const barber = barbers.find((b) => b.id === barberId) ?? null;
  const availableBarbers = barbers.filter((b) => service?.barberIds.includes(b.id));

  const days = barber
    ? Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i)).filter((d) => barber.workdays.includes(weekdayOf(d)))
    : [];

  async function loadSlots(serviceToUse: string, barberToUse: string, day: string) {
    setDate(day);
    setSlot(null);
    setSlots([]);
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ servico: serviceToUse, barbeiro: barberToUse, data: day });
      setSlots(await apiRequest<string[]>(`/api/horarios-livres?${params}`, "GET"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function chooseService(id: string) {
    setServiceId(id);
    setBarberId(null);
    setStep(2);
  }

  function chooseBarber(id: string) {
    const chosen = barbers.find((b) => b.id === id);
    setBarberId(id);
    setStep(3);
    const firstDay = chosen && Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i)).find((d) => chosen.workdays.includes(weekdayOf(d)));
    if (firstDay && serviceId) loadSlots(serviceId, id, firstDay);
    else {
      setDate(null);
      setSlots([]);
    }
  }

  async function confirm() {
    if (!service || !barber || !slot || !date) return;
    setSaving(true);
    setError(null);
    try {
      const { id } = await apiRequest<{ id: string }>("/api/agendamentos", "POST", {
        serviceId: service.id,
        barberProfileId: barber.id,
        startsAt: slot,
      });
      router.push(`/agendar/confirmado/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
      setStep(3);
      await loadSlots(service.id, barber.id, date);
      setError((e as Error).message);
    }
  }

  const covered = !!service && !!subscription?.coveredServiceIds.includes(service.id);
  const slotEnd = slot && service ? new Date(new Date(slot).getTime() + service.durationMin * 60_000) : null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col bg-fundo">
      <header className="sticky top-0 z-10 border-b border-borda bg-superficie">
        <div className="grid h-13 grid-cols-[40px_1fr_40px] items-center px-2">
          {step > 1 ? (
            <button type="button" onClick={() => setStep(step - 1)} aria-label="Voltar" className={buttonClass("ghost", "md", "w-10 px-0")}>
              <ChevronLeft />
            </button>
          ) : (
            <span />
          )}
          <div className="text-center leading-tight">
            <p className="font-bold">{["Escolha o serviço", "Escolha o barbeiro", "Escolha o horário", "Confirme"][step - 1]}</p>
            <p className="text-xs text-texto-2">{shopName}</p>
          </div>
          <Link href="/" aria-label="Sair do agendamento" className={buttonClass("ghost", "md", "w-10 px-0")}>
            <X />
          </Link>
        </div>
        <ol aria-label="Etapas do agendamento" className="grid grid-cols-4 gap-1 px-4 pt-1 pb-3.5">
          {STEPS.map((label, index) => {
            const number = index + 1;
            const done = number < step;
            const current = number === step;
            return (
              <li key={label} aria-current={current ? "step" : undefined} className={`flex flex-col gap-1.5 text-xs font-semibold ${current ? "text-marinho" : done ? "text-texto-2" : "text-texto-2"}`}>
                <span className={`h-1 rounded-xs ${done || current ? "bg-marinho" : "bg-borda"}`} />
                <span className="flex items-center gap-1">
                  {done && <Check className="size-3.5" aria-hidden="true" />}
                  {done ? label : `${number}. ${label}`}
                </span>
              </li>
            );
          })}
        </ol>
      </header>

      <main className="flex-1 px-4 pt-4 pb-32">
        {step === 1 && (
          <ul className="flex flex-col gap-2">
            {services.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => chooseService(s.id)} className="flex w-full items-center justify-between gap-4 rounded-card border border-borda bg-superficie px-4 py-3 text-left transition-colors hover:border-borda-controle hover:bg-muted">
                  <span className="min-w-0">
                    <span className="block font-semibold">{s.name}</span>
                    <span className="num block text-sm text-texto-2">{s.durationMin} min{s.description ? ` · ${s.description}` : ""}</span>
                  </span>
                  <span className="num shrink-0 font-bold">{formatBRL(s.price)}</span>
                </button>
              </li>
            ))}
            {services.length === 0 && <Notice tone="neutral">Nenhum serviço disponível para agendamento no momento.</Notice>}
          </ul>
        )}

        {step === 2 && (
          <ul className="flex flex-col gap-2">
            {availableBarbers.map((b) => (
              <li key={b.id}>
                <button type="button" onClick={() => chooseBarber(b.id)} className="flex w-full items-center gap-3 rounded-card border border-borda bg-superficie px-4 py-3 text-left transition-colors hover:border-borda-controle hover:bg-muted">
                  <Avatar name={b.name} />
                  <span className="font-semibold">{b.name}</span>
                  <ChevronRight className="ml-auto size-5 text-texto-2" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {step === 3 && service && barber && (
          <>
            <Summary name={barber.name} service={service} />

            <h2 className="mt-5 mb-2.5 font-bold">Dia</h2>
            {days.length === 0 ? (
              <Notice tone="neutral">Este barbeiro não tem expediente definido.</Notice>
            ) : (
              <div className="-mr-4 flex gap-2 overflow-x-auto pr-4 pb-1">
                {days.map((d) => {
                  const selected = d === date;
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => loadSlots(service.id, barber.id, d)}
                      className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-card border ${selected ? "border-marinho bg-marinho text-white" : "border-borda-controle bg-superficie text-texto"}`}
                    >
                      <span className={`text-xs font-semibold ${selected ? "text-white/75" : "text-texto-2"}`}>{WEEKDAY_SHORT[weekdayOf(d)]}</span>
                      <span className="num text-xl leading-tight font-bold">{d.slice(8)}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <h2 className="mt-5 mb-2.5 font-bold">Horários livres</h2>
            <FormError message={error} />
            {loading ? (
              <p className="flex items-center gap-2 text-sm text-texto-2">
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                Buscando horários...
              </p>
            ) : (
              date && slots.length === 0 && !error && <Notice tone="neutral">Sem horários livres neste dia. Tente outra data.</Notice>
            )}
            {PERIODS.map((period) => {
              const inPeriod = slots.filter((s) => {
                const minute = minutesOfDay(new Date(s));
                return minute >= period.from && minute < period.to;
              });
              if (inPeriod.length === 0) return null;
              return (
                <div key={period.name} className="mt-3 first:mt-0">
                  <p className="mb-1.5 text-xs font-semibold text-texto-2">{period.name}</p>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {inPeriod.map((s) => {
                      const selected = s === slot;
                      return (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setSlot(s)}
                          className={`num h-10 rounded-controle border text-sm font-semibold ${selected ? "border-marinho bg-marinho text-white" : "border-borda-controle bg-superficie text-marinho hover:bg-muted"}`}
                        >
                          {formatTime(new Date(s))}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {step === 4 && service && barber && slot && slotEnd && date && (
          <section className="overflow-hidden rounded-card border border-borda bg-superficie">
            <div className="bg-marinho px-4 py-4 text-white">
              <p className="text-sm text-white/75">{formatLongDate(localToInstant(date, 12 * 60))}</p>
              <p className="num text-2xl font-bold">
                {formatTime(new Date(slot))} às {formatTime(slotEnd)}
              </p>
            </div>
            <dl className="divide-y divide-borda px-4 text-sm">
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-texto-2">Barbeiro</dt>
                <dd className="flex items-center gap-2 font-semibold">
                  <Avatar name={barber.name} size="xs" />
                  {barber.name}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-texto-2">Serviço</dt>
                <dd className="font-semibold">
                  {service.name} · {service.durationMin} min
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-texto-2">Valor</dt>
                <dd className="num text-right font-semibold">
                  {covered && subscription ? (
                    <>
                      {formatBRL(0)} <s className="font-normal text-texto-2">{formatBRL(service.price)}</s>
                      <small className="block font-medium text-texto-2">
                        {subscription.planName} · restam {subscription.remainingUses} de {subscription.totalUses} até {formatLocalDate(subscription.cycleEnd)}
                      </small>
                    </>
                  ) : (
                    formatBRL(service.price)
                  )}
                </dd>
              </div>
            </dl>
          </section>
        )}
        {step === 4 && (
          <div className="mt-4 flex flex-col gap-3">
            <FormError message={error} />
            <Notice tone="neutral">
              Dá para cancelar pelo site até 2 horas antes do horário marcado.{" "}
              {covered ? "O uso só é descontado do plano quando o atendimento for concluído." : "O pagamento é feito na barbearia."}
            </Notice>
          </div>
        )}
      </main>

      {step === 3 && slot && slotEnd && date && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-borda bg-superficie px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1 leading-tight">
              <p className="num font-bold">{formatTime(new Date(slot))}</p>
              <p className="num text-xs text-texto-2">Termina por volta das {formatTime(slotEnd)}</p>
            </div>
            <Button size="lg" onClick={() => setStep(4)}>
              Continuar
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-borda bg-superficie px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-xl">
            <Button size="lg" className="w-full" disabled={saving} onClick={confirm}>
              {saving ? "Confirmando..." : "Confirmar agendamento"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Summary({ name, service }: { name: string; service: ServiceDTO }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-borda bg-superficie px-3.5 py-3">
      <Avatar name={name} />
      <div className="min-w-0 flex-1">
        <p className="leading-tight font-bold">{service.name}</p>
        <p className="num text-sm text-texto-2">
          com {name} · {service.durationMin} min
        </p>
      </div>
      <strong className="num">{formatBRL(service.price)}</strong>
    </div>
  );
}
