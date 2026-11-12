import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, describe, test, type TestContext } from "node:test";
import { PrismaClient } from "@prisma/client";
import { ActivateSubscription, CancelSubscription, RenewSubscription } from "../src/application/use-cases/subscriptions";
import { CancelAppointment, CompleteAppointment, GetAgenda } from "../src/application/use-cases/agenda";
import { CreateAppointment } from "../src/application/use-cases/booking";
import { CreateScheduleBlock } from "../src/application/use-cases/blocks";
import { CreateBarber, UpdateBarber } from "../src/application/use-cases/team";
import { SetWorkSchedule } from "../src/application/use-cases/work-schedule";
import { GetOwnerDashboard } from "../src/application/use-cases/dashboard";
import { Subscription } from "../src/domain/entities/subscription";
import { User } from "../src/domain/entities/user";
import { DomainError } from "../src/domain/shared/errors";
import { addDays, addMonths, currentMonth, localToInstant, toLocalDate, weekdayOf } from "../src/domain/shared/time";
import { BetterAuthAccountService } from "../src/infrastructure/auth/better-auth-account-service";
import { auth } from "../src/infrastructure/auth/auth";
import { PrismaUnitOfWork } from "../src/infrastructure/prisma/prisma-unit-of-work";
import { PrismaClientRepository } from "../src/infrastructure/repositories/prisma-client-repository";
import { PrismaPlanRepository } from "../src/infrastructure/repositories/prisma-plan-repository";
import { PrismaSubscriptionRepository } from "../src/infrastructure/repositories/prisma-subscription-repository";
import { PrismaAppointmentRepository } from "../src/infrastructure/repositories/prisma-appointment-repository";
import { PrismaDashboardRepository } from "../src/infrastructure/repositories/prisma-dashboard-repository";
import { PrismaScheduleBlockRepository } from "../src/infrastructure/repositories/prisma-schedule-block-repository";
import { PrismaWorkScheduleRepository } from "../src/infrastructure/repositories/prisma-work-schedule-repository";

const url = process.env.TEST_DATABASE_URL;
if (url) assert.equal(process.env.DATABASE_URL, url, "DATABASE_URL deve apontar para o mesmo banco separado de TEST_DATABASE_URL.");
const db = new PrismaClient({ datasourceUrl: url });
const owner = new User("owner", "OWNER", null);
const now = new Date();
const today = toLocalDate(now);
const asDate = (date: string) => new Date(`${date}T00:00:00Z`);

/** Força duas operações a ler o estado anterior antes de qualquer uma gravar. Retries seguem livres. */
function barrier() {
  let arrived = 0;
  let release!: () => void;
  const ready = new Promise<void>((resolve) => { release = resolve; });
  return async () => {
    if (++arrived === 2) release();
    await ready;
  };
}

async function fixture(t: TestContext) {
  const tag = crypto.randomUUID();
  const client = await db.user.create({ data: { name: "Cliente teste", email: `${tag}@client.test` } });
  const barber = await db.barberProfile.create({ data: { user: { create: { name: "Barbeiro teste", email: `${tag}@barber.test`, role: "BARBER" } } } });
  const service = await db.service.create({ data: { name: "Corte teste", durationMin: 30, price: 45, barbers: { create: { barberProfileId: barber.id } } } });
  const plan = await db.plan.create({ data: { name: "Plano teste", price: 100, usesPerCycle: 1, services: { create: { serviceId: service.id } } } });
  const date = addDays(today, 1);
  const startsAt = localToInstant(date, 10 * 60);
  const endsAt = new Date(startsAt.getTime() + 30 * 60_000);
  await db.workSchedule.create({ data: { barberProfileId: barber.id, weekday: weekdayOf(date), startTime: new Date("1970-01-01T09:00:00Z"), endTime: new Date("1970-01-01T18:00:00Z") } });
  const appointments = { barberProfileId: barber.id };
  const subscriptions = { clientId: client.id };
  t.after(async () => {
    await db.payment.deleteMany({ where: { OR: [{ appointment: appointments }, { subscription: subscriptions }] } });
    await db.subscriptionUsage.deleteMany({ where: { subscription: subscriptions } });
    await db.appointment.deleteMany({ where: appointments });
    await db.subscription.deleteMany({ where: subscriptions });
    await db.plan.delete({ where: { id: plan.id } });
    await db.service.delete({ where: { id: service.id } });
    await db.barberProfile.delete({ where: { id: barber.id } });
    await db.user.deleteMany({ where: { id: { in: [client.id, barber.userId] } } });
  });
  const activate = (database = db) => new ActivateSubscription(new PrismaClientRepository(db), new PrismaPlanRepository(db), new PrismaUnitOfWork(database));
  const createSubscription = async (start = today, usedUses = 0) => {
    const cycle = Subscription.firstCycle(start, 1);
    return db.subscription.create({ data: { clientId: client.id, planId: plan.id, ...cycle, usedUses, cycleStart: asDate(cycle.cycleStart), cycleEnd: asDate(cycle.cycleEnd) } });
  };
  const createAppointment = () => db.appointment.create({ data: { barberProfileId: barber.id, clientId: client.id, serviceId: service.id, startsAt: new Date(now.getTime() - 60 * 60_000), endsAt: new Date(now.getTime() - 30 * 60_000) } });
  return { client, barber, service, plan, startsAt, endsAt, activate, createSubscription, createAppointment };
}

describe("consistência com PostgreSQL (defina TEST_DATABASE_URL em um banco de testes migrado)", { skip: !url, timeout: 30_000 }, () => {
  after(async () => { await db.$disconnect(); });

  test("renovação e conclusão com assinatura funcionam com uma única conexão", async (t) => {
    const f = await fixture(t);
    const limitedUrl = new URL(url!);
    limitedUrl.searchParams.set("connection_limit", "1");
    // Uma conexão nova pode levar alguns segundos (ex.: Docker no Windows); um travamento real esperaria para sempre.
    limitedUrl.searchParams.set("pool_timeout", "5");
    const limited = new PrismaClient({ datasourceUrl: limitedUrl.toString() });
    t.after(() => limited.$disconnect());
    const subscription = await f.createSubscription();
    const uow = new PrismaUnitOfWork(limited);
    await new RenewSubscription(uow).execute(owner, subscription.id, { amount: 100, method: "PIX" }, now);
    const appointment = await f.createAppointment();
    await new CompleteAppointment(uow).execute(owner, appointment.id, { useSubscription: true }, now);
    assert.equal((await db.appointment.findUniqueOrThrow({ where: { id: appointment.id } })).status, "CONCLUIDO");
  });

  test("cancelar e reativar no mesmo dia mostra a assinatura ativa", async (t) => {
    const f = await fixture(t);
    const previous = await f.createSubscription();
    await new CancelSubscription(new PrismaUnitOfWork(db)).execute(owner, previous.id, now);
    const current = await f.activate().execute(owner, { clientId: f.client.id, planId: f.plan.id, amount: 100, method: "PIX" }, now);
    const shown = await new PrismaSubscriptionRepository(db).findLatestRowByClient(f.client.id, today);
    assert.equal(shown?.id, current);
    assert.equal(shown?.canceledAt, null);
  });

  test("renovar assinatura antiga não cria outra ativa nem registra pagamento", async (t) => {
    const f = await fixture(t);
    const expired = await f.createSubscription(addDays(today, -60));
    await f.createSubscription();
    await assert.rejects(new RenewSubscription(new PrismaUnitOfWork(db)).execute(owner, expired.id, { amount: 100, method: "PIX" }, now), /outra assinatura ativa/);
    assert.equal(await db.payment.count({ where: { subscriptionId: expired.id } }), 0);
    assert.ok((await db.subscription.findUniqueOrThrow({ where: { id: expired.id } })).cycleEnd < asDate(today));
  });

  test("duas ativações simultâneas geram uma assinatura e um pagamento", async (t) => {
    const f = await fixture(t);
    const wait = barrier();
    const racing = db.$extends({ query: { subscription: { async findFirst({ args, query }) { const result = await query(args); await wait(); return result; } } } });
    const activate = f.activate(racing as unknown as PrismaClient);
    const input = { clientId: f.client.id, planId: f.plan.id, amount: 100, method: "PIX" as const };
    const results = await Promise.allSettled([activate.execute(owner, input, now), activate.execute(owner, input, now)]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    for (const result of results) if (result.status === "rejected") assert.ok(result.reason instanceof DomainError, String(result.reason));
    assert.equal(await db.subscription.count({ where: { clientId: f.client.id } }), 1);
    assert.equal(await db.payment.count({ where: { subscription: { clientId: f.client.id } } }), 1);
  });

  test("renovação simultânea não desfaz cancelamento", async (t) => {
    const f = await fixture(t);
    const subscription = await f.createSubscription();
    const wait = barrier();
    const racing = db.$extends({ query: { subscription: { async findUnique({ args, query }) { const result = await query(args); await wait(); return result; } } } });
    const uow = new PrismaUnitOfWork(racing as unknown as PrismaClient);
    const results = await Promise.allSettled([
      new RenewSubscription(uow).execute(owner, subscription.id, { amount: 100, method: "PIX" }, now),
      new CancelSubscription(uow).execute(owner, subscription.id, now),
    ]);
    assert.equal(results[1].status, "fulfilled");
    assert.notEqual((await db.subscription.findUniqueOrThrow({ where: { id: subscription.id } })).canceledAt, null);
  });

  test("conclusões simultâneas respeitam o último uso e desfazem a conclusão perdedora", async (t) => {
    const f = await fixture(t);
    const subscription = await f.createSubscription();
    const first = await f.createAppointment();
    const second = await db.appointment.create({ data: { barberProfileId: f.barber.id, clientId: f.client.id, serviceId: f.service.id, startsAt: new Date(now.getTime() - 120 * 60_000), endsAt: new Date(now.getTime() - 90 * 60_000) } });
    const wait = barrier();
    const racing = db.$extends({ query: { subscription: { async findFirst({ args, query }) { const result = await query(args); await wait(); return result; } } } });
    const complete = new CompleteAppointment(new PrismaUnitOfWork(racing as unknown as PrismaClient));
    const results = await Promise.allSettled([complete.execute(owner, first.id, { useSubscription: true }, now), complete.execute(owner, second.id, { useSubscription: true }, now)]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    for (const result of results) if (result.status === "rejected") assert.ok(result.reason instanceof DomainError, String(result.reason));
    assert.equal((await db.subscription.findUniqueOrThrow({ where: { id: subscription.id } })).usedUses, 1);
    assert.equal(await db.subscriptionUsage.count({ where: { subscriptionId: subscription.id } }), 1);
    assert.equal(await db.appointment.count({ where: { barberProfileId: f.barber.id, status: "CONCLUIDO" } }), 1);
  });

  test("cancelamento simultâneo ao consumo não perde o uso já registrado", async (t) => {
    const f = await fixture(t);
    const subscription = await f.createSubscription();
    const appointment = await f.createAppointment();
    const uow = new PrismaUnitOfWork(db);
    await Promise.allSettled([
      new CompleteAppointment(uow).execute(owner, appointment.id, { useSubscription: true }, now),
      new CancelSubscription(uow).execute(owner, subscription.id, now),
    ]);
    const saved = await db.subscription.findUniqueOrThrow({ where: { id: subscription.id } });
    assert.notEqual(saved.canceledAt, null);
    assert.equal(saved.usedUses, await db.subscriptionUsage.count({ where: { subscriptionId: subscription.id } }));
  });

  test("reserva e bloqueio concorrentes nunca são gravados sobrepostos", async (t) => {
    const f = await fixture(t);
    const wait = barrier();
    const racing = db.$extends({ query: { appointment: { async findMany({ args, query }) { const result = await query(args); await wait(); return result; } } } });
    const uow = new PrismaUnitOfWork(racing as unknown as PrismaClient);
    let events = 0;
    const results = await Promise.allSettled([
      new CreateAppointment(new PrismaClientRepository(db), uow, { publish() { events++; } }).execute(new User(f.client.id, "CLIENT", null), { serviceId: f.service.id, barberProfileId: f.barber.id, startsAt: f.startsAt }),
      new CreateScheduleBlock(uow).execute(owner, { barberProfileId: f.barber.id, startsAt: f.startsAt, endsAt: f.endsAt, reason: "Bloqueio teste" }),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    for (const result of results) if (result.status === "rejected") assert.ok(result.reason instanceof DomainError, String(result.reason));
    const appointments = await db.appointment.count({ where: { barberProfileId: f.barber.id } });
    const blocks = await db.scheduleBlock.count({ where: { barberProfileId: f.barber.id } });
    assert.equal(appointments + blocks, 1);
    assert.equal(events, appointments);
  });

  test("duas reservas simultâneas preservam um horário e uma confirmação", async (t) => {
    const f = await fixture(t);
    const wait = barrier();
    const racing = db.$extends({ query: { appointment: { async findMany({ args, query }) { const result = await query(args); await wait(); return result; } } } });
    let events = 0;
    const create = new CreateAppointment(new PrismaClientRepository(db), new PrismaUnitOfWork(racing as unknown as PrismaClient), { publish() { events++; } });
    const input = { serviceId: f.service.id, barberProfileId: f.barber.id, startsAt: f.startsAt };
    const client = new User(f.client.id, "CLIENT", null);
    const results = await Promise.allSettled([create.execute(client, input), create.execute(client, input)]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    for (const result of results) if (result.status === "rejected") assert.ok(result.reason instanceof DomainError, String(result.reason));
    assert.equal(await db.appointment.count({ where: { barberProfileId: f.barber.id } }), 1);
    assert.equal(events, 1);
  });

  test("troca de expediente e reserva concorrentes não deixam cliente fora do expediente", async (t) => {
    const f = await fixture(t);
    const wait = barrier();
    const racing = db.$extends({ query: { appointment: { async findMany({ args, query }) { const result = await query(args); await wait(); return result; } } } });
    const uow = new PrismaUnitOfWork(racing as unknown as PrismaClient);
    const results = await Promise.allSettled([
      new SetWorkSchedule(uow).execute(owner, f.barber.id, [], {}, now),
      new CreateAppointment(new PrismaClientRepository(db), uow, { publish() {} }).execute(new User(f.client.id, "CLIENT", null), { serviceId: f.service.id, barberProfileId: f.barber.id, startsAt: f.startsAt }),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    for (const result of results) if (result.status === "rejected") assert.ok(result.reason instanceof DomainError, String(result.reason));
    const appointments = await db.appointment.count({ where: { barberProfileId: f.barber.id } });
    const schedules = await db.workSchedule.count({ where: { barberProfileId: f.barber.id } });
    assert.equal(appointments, schedules > 0 ? 1 : 0);
  });

  test("falha ao gravar expediente desfaz todos os cancelamentos da operação", async (t) => {
    const f = await fixture(t);
    const appointment = await db.appointment.create({ data: { barberProfileId: f.barber.id, clientId: f.client.id, serviceId: f.service.id, startsAt: f.startsAt, endsAt: f.endsAt } });
    const failing = db.$extends({ query: { workSchedule: { async createMany() { throw new Error("Falha simulada na gravação do expediente"); } } } });
    const next = [{ weekday: weekdayOf(toLocalDate(f.startsAt)), startMin: 13 * 60, endMin: 18 * 60 }];
    await assert.rejects(new SetWorkSchedule(new PrismaUnitOfWork(failing as unknown as PrismaClient)).execute(owner, f.barber.id, next, { cancelConflicts: true }, now), /Falha simulada/);
    assert.equal((await db.appointment.findUniqueOrThrow({ where: { id: appointment.id } })).status, "AGENDADO");
    assert.equal((await db.workSchedule.findFirstOrThrow({ where: { barberProfileId: f.barber.id } })).startTime.getUTCHours(), 9);
  });

  test("troca de expediente verifica também reservas após mais de um ano", async (t) => {
    const f = await fixture(t);
    const futureDate = addDays(today, 400);
    await db.workSchedule.create({ data: { barberProfileId: f.barber.id, weekday: weekdayOf(futureDate), startTime: new Date("1970-01-01T09:00:00Z"), endTime: new Date("1970-01-01T18:00:00Z") } });
    const appointment = await db.appointment.create({ data: { barberProfileId: f.barber.id, clientId: f.client.id, serviceId: f.service.id, startsAt: localToInstant(futureDate, 10 * 60), endsAt: localToInstant(futureDate, 10 * 60 + 30) } });
    await assert.rejects(new SetWorkSchedule(new PrismaUnitOfWork(db)).execute(owner, f.barber.id, [], {}, now), /cliente marcado/);
    assert.equal((await db.appointment.findUniqueOrThrow({ where: { id: appointment.id } })).status, "AGENDADO");
    assert.ok(await db.workSchedule.count({ where: { barberProfileId: f.barber.id } }) > 0);
  });

  test("alterações concorrentes de cargo preservam pelo menos um dono", async (t) => {
    const profiles: Array<{ id: string; userId: string }> = [];
    for (let index = 0; index < 2; index++) {
      profiles.push(await db.barberProfile.create({ data: { user: { create: { name: `Dono teste ${index}`, email: `${crypto.randomUUID()}@owner.test`, role: "OWNER" } } } }));
    }
    t.after(async () => {
      await db.barberProfile.deleteMany({ where: { id: { in: profiles.map((p) => p.id) } } });
      await db.user.deleteMany({ where: { id: { in: profiles.map((p) => p.userId) } } });
    });
    const wait = barrier();
    const racing = db.$extends({ query: { barberProfile: { async findUnique({ args, query }) { const result = await query(args); await wait(); return result; } } } });
    const update = new UpdateBarber(new PrismaUnitOfWork(racing as unknown as PrismaClient));
    const data = { name: "Integrante teste", phone: null, active: true, serviceIds: [], role: "BARBER" as const };
    const results = await Promise.allSettled([
      update.execute(new User(profiles[0].userId, "OWNER", profiles[0].id), profiles[1].id, data),
      update.execute(new User(profiles[1].userId, "OWNER", profiles[1].id), profiles[0].id, data),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(await db.user.count({ where: { id: { in: profiles.map((p) => p.userId) }, role: "OWNER" } }), 1);
  });

  test("faturamento por barbeiro inclui pagamento no mês de atendimento antigo", async (t) => {
    const f = await fixture(t);
    const previousMonth = addMonths(currentMonth(now), -1);
    const startsAt = localToInstant(`${previousMonth}-15`, 10 * 60);
    await db.appointment.create({ data: {
      barberProfileId: f.barber.id, clientId: f.client.id, serviceId: f.service.id,
      startsAt, endsAt: new Date(startsAt.getTime() + 30 * 60_000), status: "CONCLUIDO",
      payment: { create: { amount: 45, method: "PIX", origin: "APPOINTMENT", paidAt: now } },
    } });
    const dashboard = await new GetOwnerDashboard(new PrismaDashboardRepository(db)).execute(owner, currentMonth(now), now);
    assert.equal(dashboard.revenue.appointments, 45);
    assert.equal(dashboard.barbers.reduce((sum, barber) => sum + barber.revenue, 0), 45);
    assert.equal(dashboard.barbers[0].name, "Barbeiro teste");
    assert.equal(dashboard.barbers[0].share, 0);
    assert.equal(dashboard.barbers[0].paidAppointments, 1);
  });

  test("barbeiro e cliente não acessam nem alteram agenda de outra pessoa", async (t) => {
    const first = await fixture(t);
    const second = await fixture(t);
    await first.createAppointment();
    const other = await second.createAppointment();
    const appointments = new PrismaAppointmentRepository(db);
    const actor = new User(first.barber.userId, "BARBER", first.barber.id);
    const agenda = await new GetAgenda(appointments, new PrismaScheduleBlockRepository(db), new PrismaWorkScheduleRepository(db)).execute(actor, { from: new Date(now.getTime() - 2 * 60 * 60_000), to: now, barberProfileId: second.barber.id });
    assert.ok(agenda.appointments.length > 0);
    assert.ok(agenda.appointments.every((a) => a.barberProfileId === first.barber.id));
    await assert.rejects(new CompleteAppointment(new PrismaUnitOfWork(db)).execute(actor, other.id, { useSubscription: false, amount: 45, method: "PIX" }, now), /permissão/);
    await assert.rejects(new CancelAppointment(appointments).execute(new User(first.client.id, "CLIENT", null), other.id, now), /permissão/);
  });

  test("migração corrige ciclos antigos de 31 datas e pode ser reaplicada sem encurtar novamente", async (t) => {
    const f = await fixture(t);
    const subscription = await f.createSubscription();
    await db.subscription.update({ where: { id: subscription.id }, data: { cycleEnd: asDate(addDays(today, 30)) } });
    const sql = readFileSync("prisma/migrations/20261112120000_fix_subscription_cycle/migration.sql", "utf8");
    await db.$executeRawUnsafe(sql);
    await db.$executeRawUnsafe(sql);
    assert.equal((await db.subscription.findUniqueOrThrow({ where: { id: subscription.id } })).cycleEnd.toISOString().slice(0, 10), addDays(today, 29));
  });

  test("falha no serviço desfaz conta e credencial; repetir cadastro com o mesmo e-mail funciona", async (t) => {
    const f = await fixture(t);
    const email = `${crypto.randomUUID()}@team.test`;
    const password = crypto.randomUUID();
    const create = new CreateBarber(new BetterAuthAccountService(db));
    const input = { name: "Integrante teste", email, phone: null, password, serviceIds: [crypto.randomUUID()] };
    t.after(async () => { await db.barberProfile.deleteMany({ where: { user: { email } } }); await db.user.deleteMany({ where: { email } }); });
    await assert.rejects(create.execute(owner, input));
    assert.equal(await db.user.count({ where: { email } }), 0);
    const profileId = await create.execute(owner, { ...input, serviceIds: [f.service.id] });
    const profile = await db.barberProfile.findUniqueOrThrow({ where: { id: profileId }, include: { user: { include: { accounts: true } } } });
    assert.equal(profile.user.accounts.length, 1);
    assert.equal(profile.user.role, "BARBER");
    const context = await auth.$context;
    assert.equal(await context.password.verify({ hash: profile.user.accounts[0].password!, password }), true);
    const response = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
    assert.equal(response.status, 200);
  });
});
