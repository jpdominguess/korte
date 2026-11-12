import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Appointment } from "../src/domain/entities/appointment";
import { Subscription } from "../src/domain/entities/subscription";
import { localToInstant } from "../src/domain/shared/time";
import { AgendaWeek } from "../app/_components/agenda-week";
import { BarberDistribution } from "../app/painel/barber-distribution";

const startsAt = new Date("2026-11-12T15:00:00Z");
const appointment = () => new Appointment({
  id: "appointment", barberProfileId: "barber", serviceId: "service", clientId: "client",
  walkInName: null, walkInPhone: null, startsAt, endsAt: new Date("2026-11-12T15:30:00Z"), status: "AGENDADO",
});

test("conclusão antes do horário falha sem mudar o estado nem consumir assinatura", () => {
  const future = appointment();
  const before = new Date(startsAt.getTime() - 1);
  const subscription = new Subscription({
    id: "subscription", clientId: "client", planId: "plan", canceledAt: null,
    ...Subscription.firstCycle("2026-11-12", 3),
  });
  assert.throws(() => future.complete(before), /horário de início/);
  assert.throws(() => future.completeWithSubscription(subscription, before), /horário de início/);
  assert.equal(future.status, "AGENDADO");
  assert.equal(subscription.usedUses, 0);
});

test("conclusão a partir do início continua funcionando com e sem assinatura", () => {
  const paid = appointment();
  paid.complete(startsAt);
  assert.equal(paid.status, "CONCLUIDO");
  assert.throws(() => paid.complete(startsAt), /encerrado/);
  const covered = appointment();
  const subscription = new Subscription({
    id: "subscription", clientId: "client", planId: "plan", canceledAt: null,
    ...Subscription.firstCycle("2026-11-12", 3),
  });
  covered.completeWithSubscription(subscription, startsAt);
  assert.equal(covered.status, "CONCLUIDO");
  assert.equal(subscription.usedUses, 1);
});

test("cancelamento preserva o limite de duas horas", () => {
  assert.equal(Appointment.clientCanCancel(startsAt, new Date(startsAt.getTime() - 2 * 60 * 60_000)), true);
  assert.equal(Appointment.clientCanCancel(startsAt, new Date(startsAt.getTime() - 2 * 60 * 60_000 + 1)), false);
});

test("semana exibe todos os trechos do bloqueio, inclusive iniciado antes da semana", () => {
  const blocks = [{ id: "block", barberProfileId: "barber", startsAt: localToInstant("2026-11-08", 10 * 60), endsAt: localToInstant("2026-11-11", 12 * 60), reason: "Indisponível teste" }];
  const originalStart = blocks[0].startsAt.getTime();
  const html = renderToStaticMarkup(createElement(AgendaWeek, { start: "2026-11-09", appointments: [], blocks, now: startsAt }));
  assert.equal(html.match(/Indisponível teste/g)?.length, 3);
  assert.equal(html.match(/24:00/g)?.length, 2);
  assert.match(html, /12:00/);
  assert.equal(blocks[0].startsAt.getTime(), originalStart);
});

test("bloqueio que acaba à meia-noite não aparece no dia seguinte", () => {
  const blocks = [{ id: "block", barberProfileId: "barber", startsAt: localToInstant("2026-11-09", 10 * 60), endsAt: localToInstant("2026-11-10", 0), reason: "Limite teste" }];
  const html = renderToStaticMarkup(createElement(AgendaWeek, { start: "2026-11-09", appointments: [], blocks, now: startsAt }));
  assert.equal(html.match(/Limite teste/g)?.length, 1);
  assert.match(html, /24:00/);
});

test("distribuição calcula média pelos pagamentos mesmo sem atendimento agendado no mês", () => {
  const html = renderToStaticMarkup(createElement(BarberDistribution, {
    barbers: [{ id: "barber", name: "Barbeiro teste", completed: 0, share: 0, revenue: 45, paidAppointments: 1, photoUrl: null }],
    totals: { completed: 0, appointments: 45, subscriptions: 0, total: 45 },
  })).replace(/\u00a0/g, " ");
  assert.match(html, /R\$ 45,00 por atendimento pago/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});
