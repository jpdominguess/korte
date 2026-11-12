"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import type { BarberDTO, ClientOptionDTO, ServiceDTO } from "@/application/dto";
import { formatBRL, formatTime } from "@/domain/shared/format";
import { Button, Card, Field, FormError, Input, LinkButton, Notice, Select } from "~/_components/ui";
import { apiRequest, useSubmit } from "~/_lib/use-submit";

interface Props {
  barbers: BarberDTO[];
  services: ServiceDTO[];
  clients: ClientOptionDTO[];
  initialBarberId: string;
  initialDate: string;
  /** Hora clicada na agenda (HH:MM), escolhida sozinha quando o serviço cabe nela. */
  desiredTime: string | null;
  today: string;
  backHref: string;
}

export function WalkInForm({ barbers, services, clients, initialBarberId, initialDate, desiredTime, today, backHref }: Props) {
  const router = useRouter();
  const { pending, error, setError, submit } = useSubmit();
  const [barberId, setBarberId] = useState(initialBarberId);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"registered" | "walkIn">("walkIn");

  const barber = barbers.find((b) => b.id === barberId);
  const fromAgenda = !!desiredTime && barberId === initialBarberId && date === initialDate;
  const desiredMissing = fromAgenda && slots !== null && !slots.some((s) => formatTime(new Date(s)) === desiredTime);
  const options = services.filter((s) => barber?.serviceIds.includes(s.id));

  async function loadSlots(nextBarber: string, nextService: string, nextDate: string) {
    setSlot(null);
    setSlots(null);
    if (!nextBarber || !nextService || !nextDate) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ servico: nextService, barbeiro: nextBarber, data: nextDate });
      const found = await apiRequest<string[]>(`/api/horarios-livres?${params}`, "GET");
      setSlots(found);
      if (desiredTime && nextBarber === initialBarberId && nextDate === initialDate) {
        const match = found.find((s) => formatTime(new Date(s)) === desiredTime);
        if (match) setSlot(match);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slot) {
      setError("Escolha um horário.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const customer =
      mode === "registered"
        ? { clientId: form.get("clientId") }
        : { walkInName: form.get("walkInName"), walkInPhone: form.get("walkInPhone") };
    await submit("/api/agendamentos", "POST", { serviceId, barberProfileId: barberId, startsAt: slot, ...customer }, () => {
      router.push(backHref);
      router.refresh();
    });
  }

  return (
    <Card className="max-w-2xl p-4 lg:p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {barbers.length > 1 && (
          <Field label="Barbeiro" htmlFor="barber">
            <Select
              id="barber"
              value={barberId}
              required
              onChange={(e) => {
                setBarberId(e.target.value);
                setServiceId("");
                setSlots(null);
                setSlot(null);
              }}
            >
              <option value="">Escolha</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Serviço" htmlFor="service">
            <Select
              id="service"
              value={serviceId}
              required
              onChange={(e) => {
                setServiceId(e.target.value);
                loadSlots(barberId, e.target.value, date);
              }}
            >
              <option value="">Escolha</option>
              {options.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.durationMin} min · {formatBRL(s.price)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Data" htmlFor="date">
            <Input
              id="date"
              type="date"
              value={date}
              min={today}
              required
              onChange={(e) => {
                setDate(e.target.value);
                loadSlots(barberId, serviceId, e.target.value);
              }}
            />
          </Field>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold">Horário</p>
          {loading && (
            <p className="flex items-center gap-2 text-sm text-texto-2">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              Buscando horários...
            </p>
          )}
          {!loading && slots === null && (
            <p className="text-sm text-texto-2">
              {fromAgenda ? `Você escolheu ${desiredTime} na agenda. Escolha o serviço para confirmar.` : "Escolha o serviço e a data para ver os horários."}
            </p>
          )}
          {!loading && desiredMissing && (
            <div className="mb-3">
              <Notice tone="warning">
                Esse serviço não cabe às {desiredTime}: o espaço livre é menor que a duração, ou o horário foi ocupado. Escolha um dos horários livres abaixo.
              </Notice>
            </div>
          )}
          {!loading && slots?.length === 0 && <Notice tone="neutral">Sem horários livres nesta data.</Notice>}
          {slots && slots.length > 0 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={s === slot}
                  onClick={() => setSlot(s)}
                  className={`num h-10 rounded-controle border text-sm font-semibold ${s === slot ? "border-marinho bg-marinho text-white" : "border-borda-controle bg-superficie text-marinho hover:bg-muted"}`}
                >
                  {formatTime(new Date(s))}
                </button>
              ))}
            </div>
          )}
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-semibold">Cliente</legend>
          <div className="flex gap-4">
            <label className="inline-flex min-h-9 items-center gap-2 text-sm">
              <input type="radio" name="mode" checked={mode === "walkIn"} onChange={() => setMode("walkIn")} className="size-4.5" />
              Avulso
            </label>
            <label className="inline-flex min-h-9 items-center gap-2 text-sm">
              <input type="radio" name="mode" checked={mode === "registered"} onChange={() => setMode("registered")} className="size-4.5" />
              Cadastrado
            </label>
          </div>
          {mode === "registered" ? (
            <Field label="Cliente cadastrado" htmlFor="clientId">
              <Select id="clientId" name="clientId" required>
                <option value="">Escolha</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                    {client.phone ? ` · ${client.phone}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome" htmlFor="walkInName">
                <Input id="walkInName" name="walkInName" required maxLength={80} />
              </Field>
              <Field label="Telefone" htmlFor="walkInPhone">
                <Input id="walkInPhone" name="walkInPhone" type="tel" required maxLength={20} />
              </Field>
            </div>
          )}
        </fieldset>

        <FormError message={error} />
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Registrar agendamento"}
          </Button>
          <LinkButton href={backHref} variant="secondary">
            Voltar
          </LinkButton>
        </div>
      </form>
    </Card>
  );
}
