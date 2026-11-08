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

  console.info("Seed concluído.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
