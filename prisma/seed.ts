import { PrismaClient } from "@prisma/client";
import { auth } from "../src/infrastructure/auth/auth";

const db = new PrismaClient();

const password = process.env.SEED_PASSWORD;
if (!password || password.length < 8) throw new Error("Defina SEED_PASSWORD no .env com pelo menos 8 caracteres.");

async function createAccount(name: string, email: string, phone: string, role: string) {
  const context = await auth.$context;
  const existing = await context.internalAdapter.findUserByEmail(email);
  if (existing) return existing.user.id;

  const user = await context.internalAdapter.createUser({ name, email, phone, role, emailVerified: true }, { method: "email-password" });
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
  for (const [name, email, phone] of [
    ["Diego Santana", "diego@korte.test", "(19) 99734-1001"],
    ["Thiago Lemos", "thiago@korte.test", "(19) 99734-1002"],
    ["Caio Ferreira", "caio@korte.test", "(19) 99734-1003"],
  ]) {
    const userId = await createAccount(name, email, phone, "BARBER");
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

  await createAccount("Lucas Almeida", "cliente@korte.test", "(19) 99734-2108", "CLIENT");
}

async function main() {
  const ownerId = await createAccount("Rafael Moura", "dono@korte.test", "(19) 99812-4470", "OWNER");

  if (!(await db.barbershop.findFirst())) {
    await db.barbershop.create({
      data: {
        ownerId,
        name: "Barbearia Vila Rica",
        cep: "13400-180",
        street: "Rua Governador Pedro de Toledo",
        number: "1240",
        city: "Piracicaba/SP",
        phone: "(19) 3422-4470",
        whatsapp: "5519998124470",
      },
    });
  }

  await seedTeamAndCatalog(ownerId);

  console.info("Seed concluído.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
