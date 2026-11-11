import { PrismaClient } from "@prisma/client";
import { addDays, localToInstant, toLocalDate, weekdayOf } from "../src/domain/shared/time";
import { auth } from "../src/infrastructure/auth/auth";

const db = new PrismaClient();

const password = process.env.SEED_PASSWORD;
if (!password || password.length < 8) throw new Error("Defina SEED_PASSWORD no .env com pelo menos 8 caracteres.");

async function createAccount(name: string, email: string, role: string) {
  const context = await auth.$context;
  const existing = await context.internalAdapter.findUserByEmail(email);
  if (existing) return existing.user.id;

  const user = await context.internalAdapter.createUser({ name, email, role, emailVerified: true }, { method: "email-password" });
  await context.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: await context.password.hash(password!),
  });
  return user.id;
}

const minutes = (hour: number) => new Date(Date.UTC(1970, 0, 1, hour));

/** Terça a sábado, das 9h às 19h, com almoço das 12h às 13h. */
async function setDefaultSchedule(barberProfileId: string) {
  if (await db.workSchedule.findFirst({ where: { barberProfileId } })) return;
  await db.workSchedule.createMany({
    data: [2, 3, 4, 5, 6].flatMap((weekday) => [
      { barberProfileId, weekday, startTime: minutes(9), endTime: minutes(12) },
      { barberProfileId, weekday, startTime: minutes(13), endTime: minutes(19) },
    ]),
  });
}

async function seedTeamAndCatalog(ownerId: string) {
  const ownerProfile = await db.barberProfile.upsert({ where: { userId: ownerId }, update: {}, create: { userId: ownerId } });
  const team = [ownerProfile.id];
  for (const [name, email] of [
    ["Diego Santana", "diego@korte.test"],
    ["Thiago Lemos", "thiago@korte.test"],
    ["Caio Ferreira", "caio@korte.test"],
  ]) {
    const userId = await createAccount(name, email, "BARBER");
    const profile = await db.barberProfile.upsert({ where: { userId }, update: {}, create: { userId } });
    team.push(profile.id);
  }
  for (const id of team) await setDefaultSchedule(id);

  if ((await db.service.count()) === 0) {
    for (const [name, durationMin, price] of [
      ["Corte", 30, 45],
      ["Barba", 20, 35],
      ["Sobrancelha", 10, 15],
      ["Pigmentação", 30, 40],
      ["Corte infantil", 30, 35],
    ] as const) {
      await db.service.create({
        data: { name, durationMin, price, barbers: { create: team.map((barberProfileId) => ({ barberProfileId })) } },
      });
    }
  }

  await createAccount("Lucas Almeida", "cliente@korte.test", "CLIENT");

  if ((await db.plan.count()) === 0) {
    const corte = await db.service.findFirstOrThrow({ where: { name: "Corte" } });
    await db.plan.create({
      data: { name: "Clube Corte", price: 99, usesPerCycle: 4, services: { create: { serviceId: corte.id } } },
    });
  }
}

/** Gerador simples com semente fixa, para o seed produzir sempre o mesmo histórico. */
function createRandom(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const METHODS = ["CASH", "PIX", "DEBIT", "CREDIT"];
const SLOT_MINUTES = [...Array(6).keys()].map((i) => 9 * 60 + i * 30).concat([...Array(12).keys()].map((i) => 13 * 60 + i * 30));

/** Histórico fictício para demonstração: atendimentos dos últimos 30 dias, próximos dias e assinaturas. */
async function seedDemoData() {
  if ((await db.appointment.count()) > 0) return;

  const clientIds: string[] = [];
  for (const [name, email] of [
    ["Matheus Oliveira", "matheus@korte.test"],
    ["Gabriel Rocha", "gabriel@korte.test"],
    ["Pedro Henrique Costa", "pedro@korte.test"],
    ["Felipe Nunes", "felipe@korte.test"],
    ["Arthur Ribeiro", "arthur@korte.test"],
    ["Renan Vieira", "renan@korte.test"],
  ]) {
    clientIds.push(await createAccount(name, email, "CLIENT"));
  }
  const mainClient = await db.user.findUniqueOrThrow({ where: { email: "cliente@korte.test" } });
  clientIds.push(mainClient.id);

  const barbers = await db.barberProfile.findMany();
  const services = await db.service.findMany();
  const plan = await db.plan.findFirstOrThrow();
  const random = createRandom(20261108);
  const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)];

  const now = new Date();
  const today = toLocalDate(now);

  for (let offset = -30; offset <= 7; offset++) {
    const date = addDays(today, offset);
    if ([0, 1].includes(weekdayOf(date))) continue;

    for (const barber of barbers) {
      for (const minute of SLOT_MINUTES) {
        const startsAt = localToInstant(date, minute);
        const isPast = startsAt < now;
        if (random() > (isPast ? 0.6 : 0.3)) continue;

        const service = pick(services);
        const endsAt = new Date(startsAt.getTime() + service.durationMin * 60_000);
        const roll = random();
        const status = !isPast ? "AGENDADO" : roll < 0.86 ? "CONCLUIDO" : roll < 0.94 ? "CANCELADO" : "FALTOU";

        const appointment = await db.appointment.create({
          data: { barberProfileId: barber.id, serviceId: service.id, clientId: pick(clientIds), startsAt, endsAt, status },
        });
        if (status === "CONCLUIDO") {
          await db.payment.create({
            data: { appointmentId: appointment.id, amount: service.price, method: pick(METHODS), origin: "APPOINTMENT", paidAt: endsAt },
          });
        }
      }
    }
  }

  const subscriptions = [
    { clientId: mainClient.id, startOffset: -10, used: 1 },
    { clientId: clientIds[5], startOffset: -6, used: 2 },
    { clientId: clientIds[3], startOffset: -2, used: 0 },
    { clientId: clientIds[4], startOffset: -35, used: 4 },
  ];
  for (const { clientId, startOffset, used } of subscriptions) {
    const cycleStart = addDays(today, startOffset);
    const subscription = await db.subscription.create({
      data: {
        clientId,
        planId: plan.id,
        cycleStart: new Date(`${cycleStart}T00:00:00Z`),
        cycleEnd: new Date(`${addDays(cycleStart, 30)}T00:00:00Z`),
        totalUses: plan.usesPerCycle,
        usedUses: used,
      },
    });
    await db.payment.create({
      data: { subscriptionId: subscription.id, amount: plan.price, method: "PIX", origin: "ACTIVATION", paidAt: localToInstant(cycleStart, 10 * 60) },
    });
  }
}

async function main() {
  const ownerId = await createAccount("Rafael Moura", "dono@korte.test", "OWNER");

  if (!(await db.barbershop.findFirst())) {
    await db.barbershop.create({
      data: {
        ownerId,
        name: "Barbearia Vila Rica",
        cep: "13414-155",
        street: "Av. Diácono Jair de Oliveira",
        number: "1005",
        city: "Piracicaba/SP",
      },
    });
  }

  await seedTeamAndCatalog(ownerId);
  if (process.env.SEED_DEMO !== "false") await seedDemoData();

  console.info("Seed concluído.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
