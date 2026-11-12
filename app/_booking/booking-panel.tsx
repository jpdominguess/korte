"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import type { ClientSubscriptionDTO, PublicBarberDTO, ServiceDTO } from "@/application/dto";
import { formatBRL, formatLongDate, formatTime } from "@/domain/shared/format";
import { addDays, minutesOfDay, weekdayOf } from "@/domain/shared/time";
import { SignupForm } from "~/(acesso)/cadastro/signup-form";
import { LoginForm } from "~/(acesso)/login/login-form";
import { Avatar, Button, FormError, Notice } from "~/_components/ui";
import { apiRequest } from "~/_lib/use-submit";

const DAYS_AHEAD = 21;
const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const PERIODS = [
  { name: "Manhã", from: 0, to: 12 * 60 },
  { name: "Tarde", from: 12 * 60, to: 18 * 60 },
  { name: "Noite", from: 18 * 60, to: 24 * 60 },
];

/** Quem está vendo a página: cliente logado, alguém da equipe ou visitante. */
export type Viewer = "CLIENT" | "STAFF" | null;

interface Props {
  services: ServiceDTO[];
  barbers: PublicBarberDTO[];
  today: string;
  viewer: Viewer;
  subscription: ClientSubscriptionDTO | null;
  aside?: ReactNode;
}

export function BookingPanel({ services, barbers, today, viewer: initialViewer, subscription, aside }: Props) {
  const router = useRouter();
  const confirmRef = useRef<HTMLElement>(null);
  const scrollBlock = useRef<ScrollLogicalPosition>("nearest");
  const request = useRef(0);
  const [viewer, setViewer] = useState<Viewer>(initialViewer);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [auth, setAuth] = useState<"signup" | "login" | null>(null);
  const [saving, setSaving] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [scrollRequest, setScrollRequest] = useState(0);

  // Leva a pessoa até o botão de agendar depois que ele já está na tela.
  useEffect(() => {
    if (scrollRequest === 0) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    confirmRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: scrollBlock.current });
  }, [scrollRequest]);

  function scrollToConfirm(block: ScrollLogicalPosition) {
    scrollBlock.current = block;
    setScrollRequest((n) => n + 1);
  }

  const service = services.find((s) => s.id === serviceId) ?? null;
  const barber = barbers.find((b) => b.id === barberId) ?? null;
  const workdaysOf = (b: PublicBarberDTO) =>
    Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i)).filter((d) => b.workdays.includes(weekdayOf(d)));
  const days = barber ? workdaysOf(barber) : [];
  const covered = !!service && !!subscription?.coveredServiceIds.includes(service.id);
  const slotStart = slot ? new Date(slot) : null;

  function fetchSlots(serviceToUse: string, barberToUse: string, day: string) {
    const params = new URLSearchParams({ servico: serviceToUse, barbeiro: barberToUse, data: day });
    return apiRequest<string[]>(`/api/horarios-livres?${params}`, "GET");
  }

  function clearTime() {
    request.current++;
    setDate(null);
    setSlots([]);
    setSlot(null);
    setLoading(false);
    setSlotsError(null);
  }

  async function showDay(serviceToUse: string, barberToUse: string, day: string) {
    const id = ++request.current;
    setDate(day);
    setSlot(null);
    setSlots([]);
    setLoading(true);
    setSlotsError(null);
    try {
      const found = await fetchSlots(serviceToUse, barberToUse, day);
      if (id === request.current) setSlots(found);
    } catch (e) {
      if (id === request.current) setSlotsError((e as Error).message);
    } finally {
      if (id === request.current) setLoading(false);
    }
  }

  /** Abre o primeiro dia com horário livre, olhando até uma semana de expediente. */
  async function showFirstFreeDay(serviceToUse: string, chosen: PublicBarberDTO) {
    const candidates = workdaysOf(chosen).slice(0, 7);
    if (candidates.length === 0) return clearTime();
    const id = ++request.current;
    setDate(candidates[0]);
    setSlot(null);
    setSlots([]);
    setLoading(true);
    setSlotsError(null);
    try {
      for (const day of candidates) {
        const found = await fetchSlots(serviceToUse, chosen.id, day);
        if (id !== request.current) return;
        if (found.length > 0 || day === candidates[candidates.length - 1]) {
          setDate(day);
          setSlots(found);
          return;
        }
      }
    } catch (e) {
      if (id === request.current) setSlotsError((e as Error).message);
    } finally {
      if (id === request.current) setLoading(false);
    }
  }

  function chooseService(chosen: ServiceDTO) {
    setServiceId(chosen.id);
    setAuth(null);
    setBookingError(null);
    const available = barbers.filter((b) => chosen.barberIds.includes(b.id));
    const next = barber && chosen.barberIds.includes(barber.id) ? barber : available.length === 1 ? available[0] : null;
    setBarberId(next?.id ?? null);
    if (next) showFirstFreeDay(chosen.id, next);
    else clearTime();
  }

  function chooseBarber(chosen: PublicBarberDTO) {
    setBarberId(chosen.id);
    setAuth(null);
    setBookingError(null);
    if (service) showFirstFreeDay(service.id, chosen);
    else clearTime();
  }

  function chooseSlot(chosen: string) {
    setSlot(chosen);
    setAuth(null);
    setBookingError(null);
    scrollToConfirm("nearest");
  }

  async function book() {
    if (!service || !barber || !slot || !date) return;
    setSaving(true);
    setBookingError(null);
    try {
      const { id } = await apiRequest<{ id: string }>("/api/agendamentos", "POST", {
        serviceId: service.id,
        barberProfileId: barber.id,
        startsAt: slot,
      });
      router.push(`/agendar/confirmado/${id}`);
    } catch (e) {
      setBookingError((e as Error).message);
      setSaving(false);
      setAuth(null);
      await showDay(service.id, barber.id, date);
    }
  }

  /** Depois de criar a conta ou entrar, a pessoa já está logada e o agendamento segue. */
  async function bookAfterAuth() {
    setViewer("CLIENT");
    await book();
  }

  function schedule() {
    if (viewer === "CLIENT") {
      book();
      return;
    }
    setAuth("signup");
    scrollToConfirm("start");
  }

  return (
    <div id="agendar" className="mx-auto grid max-w-5xl scroll-mt-4 gap-x-10 gap-y-8 px-4 pt-6 pb-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:pt-10 lg:pb-16">
      <div className="flex min-w-0 flex-col gap-8">
        <section aria-labelledby="titulo-servico">
          <h2 id="titulo-servico" className="mb-3 font-marca text-2xl">
            Escolha o serviço
          </h2>
          {services.length === 0 ? (
            <Notice tone="neutral">Nenhum serviço disponível para agendamento no momento.</Notice>
          ) : (
            <ul className="divide-y divide-borda overflow-hidden rounded-card border border-borda bg-superficie">
              {services.map((s) => {
                const selected = s.id === serviceId;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => chooseService(s)}
                      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${selected ? "bg-marinho-claro" : "hover:bg-muted"}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`grid size-5 shrink-0 place-items-center rounded-full border transition-colors ${selected ? "border-marinho bg-marinho text-white" : "border-borda-controle bg-superficie"}`}
                      >
                        {selected && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{s.name}</span>
                        <span className="num block text-sm text-texto-2">
                          {s.durationMin} min{s.description ? ` · ${s.description}` : ""}
                        </span>
                      </span>
                      <span className="num shrink-0 font-bold">{formatBRL(s.price)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="titulo-profissional">
          <h2 id="titulo-profissional" className="mb-3 font-marca text-2xl">
            Escolha o profissional
          </h2>
          {barbers.length === 0 ? (
            <Notice tone="neutral">Equipe em definição.</Notice>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {barbers.map((b) => {
                const selected = b.id === barberId;
                const available = !service || service.barberIds.includes(b.id);
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      disabled={!available}
                      onClick={() => chooseBarber(b)}
                      className={`flex h-full w-full flex-col items-center gap-2 rounded-card border px-2 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${selected ? "border-marinho bg-marinho-claro" : "border-borda bg-superficie hover:border-borda-controle hover:bg-muted"}`}
                    >
                      <Avatar name={b.name} src={b.photoUrl} size="xl" dark={selected} />
                      <span>{b.name.split(" ")[0]}</span>
                      {!available && <span className="text-xs font-medium text-texto-2">Não faz este serviço</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="titulo-horario">
          <h2 id="titulo-horario" className="mb-3 font-marca text-2xl">
            Escolha o dia e o horário
          </h2>
          {!service || !barber ? (
            <p className="rounded-card border border-dashed border-borda-controle px-4 py-6 text-center text-sm text-texto-2">
              Escolha o serviço e o profissional para ver os horários livres.
            </p>
          ) : days.length === 0 ? (
            <Notice tone="neutral">{barber.name.split(" ")[0]} ainda não tem expediente nas próximas semanas.</Notice>
          ) : (
            <div className="surgir">
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:thin]">
                {days.map((d) => {
                  const selected = d === date;
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={selected}
                      aria-label={formatLongDate(new Date(`${d}T15:00:00Z`))}
                      onClick={() => showDay(service.id, barber.id, d)}
                      className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-card border transition-colors ${selected ? "border-marinho bg-marinho text-white" : "border-borda-controle bg-superficie text-texto hover:bg-muted"}`}
                    >
                      <span className={`text-xs font-semibold ${selected ? "text-white/75" : "text-texto-2"}`}>{WEEKDAY_SHORT[weekdayOf(d)]}</span>
                      <span className="num text-xl leading-tight font-bold">{d.slice(8)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4" aria-live="polite">
                <FormError message={slotsError} />
                {loading ? (
                  <p className="flex items-center gap-2 py-2 text-sm text-texto-2">
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    Buscando horários livres...
                  </p>
                ) : (
                  date && slots.length === 0 && !slotsError && <Notice tone="neutral">Sem horários livres neste dia. Escolha outra data.</Notice>
                )}
                {!loading && slots.length > 0 && (
                  <div key={date} className="surgir flex flex-col gap-3">
                    {PERIODS.map((period) => {
                      const inPeriod = slots.filter((s) => {
                        const minute = minutesOfDay(new Date(s));
                        return minute >= period.from && minute < period.to;
                      });
                      if (inPeriod.length === 0) return null;
                      return (
                        <div key={period.name}>
                          <p className="mb-1.5 text-xs font-semibold text-texto-2">{period.name}</p>
                          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                            {inPeriod.map((s) => {
                              const selected = s === slot;
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  aria-pressed={selected}
                                  onClick={() => chooseSlot(s)}
                                  className={`num h-11 rounded-controle border text-sm font-semibold transition-colors ${selected ? "border-marinho bg-marinho text-white" : "border-borda-controle bg-superficie text-marinho hover:bg-muted"}`}
                                >
                                  {formatTime(new Date(s))}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {service && barber && (
          <section
            ref={confirmRef}
            aria-labelledby="titulo-confirmar"
            className="surgir scroll-mt-4 rounded-card border border-borda bg-superficie p-5 shadow-[0_1px_2px_rgba(5,9,41,0.05),0_12px_32px_-16px_rgba(5,9,41,0.22)]"
          >
            <h2 id="titulo-confirmar" className="font-marca text-2xl">
              Seu horário
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={barber.name} src={barber.photoUrl} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="leading-tight font-bold">
                  {service.name} com {barber.name.split(" ")[0]}
                </p>
                <p className={`num mt-0.5 text-sm ${slotStart ? "text-texto" : "text-texto-2"}`}>
                  {slotStart ? `${formatLongDate(slotStart)}, ${formatTime(slotStart)}` : "Escolha um horário acima"}
                </p>
              </div>
              <p className="num shrink-0 text-right leading-tight font-bold">
                {covered ? formatBRL(0) : formatBRL(service.price)}
                {covered && <small className="block text-xs font-medium text-texto-2">pelo plano</small>}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <FormError message={bookingError} />
              {viewer === "STAFF" ? (
                <Notice tone="neutral">
                  Você entrou como equipe da barbearia. Para marcar para um cliente, use{" "}
                  <Link href="/agenda/novo" className="font-semibold text-destaque">
                    o agendamento presencial
                  </Link>
                  .
                </Notice>
              ) : auth ? (
                <div className="surgir border-t border-borda pt-4">
                  <p className="font-bold">{auth === "signup" ? "Falta só criar sua conta" : "Entre na sua conta"}</p>
                  <p className="mt-1 mb-4 text-sm text-texto-2">
                    {auth === "signup"
                      ? "Você recebe a confirmação de agendamento por e-mail e pode cancelar caso necessário."
                      : "Use o e-mail e a senha que você cadastrou."}
                  </p>
                  {auth === "signup" ? (
                    <SignupForm onDone={bookAfterAuth} submitLabel="Criar conta e agendar" />
                  ) : (
                    <LoginForm onDone={bookAfterAuth} submitLabel="Entrar e agendar" />
                  )}
                  <p className="mt-4 text-sm text-texto-2">
                    {auth === "signup" ? "Já tem conta? " : "Ainda não tem conta? "}
                    <button type="button" onClick={() => setAuth(auth === "signup" ? "login" : "signup")} className="font-semibold text-destaque hover:underline">
                      {auth === "signup" ? "Entrar" : "Criar conta"}
                    </button>
                  </p>
                </div>
              ) : (
                <>
                  <Button size="lg" className="w-full" disabled={!slot || saving} onClick={schedule}>
                    {saving ? "Agendando..." : slot ? "Agendar horário" : "Escolha um horário"}
                  </Button>
                  <p className="text-xs text-texto-2">
                    {viewer === "CLIENT" ? "" : "Para confirmar, você só informa nome, e-mail e uma senha. "}
                    Pagamento na barbearia. Dá para cancelar pelo site até 2 horas antes.
                  </p>
                </>
              )}
            </div>
          </section>
        )}
      </div>

      {aside && <div className="flex min-w-0 flex-col gap-8 lg:sticky lg:top-6 lg:self-start">{aside}</div>}
    </div>
  );
}
