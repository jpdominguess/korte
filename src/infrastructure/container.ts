import { GetBarbershop, UpdateBarbershop } from "@/application/use-cases/barbershop";
import { CreateService, ListServices, UpdateService } from "@/application/use-cases/catalog";
import {
  CreateBarber,
  EnableOwnerBarberProfile,
  ListActiveBarbers,
  ListBarbers,
  UpdateBarber,
} from "@/application/use-cases/team";
import { BetterAuthAccountService } from "./auth/better-auth-account-service";
import { prisma } from "./prisma/client";
import { PrismaBarberRepository } from "./repositories/prisma-barber-repository";
import { PrismaBarbershopRepository } from "./repositories/prisma-barbershop-repository";
import { PrismaServiceRepository } from "./repositories/prisma-service-repository";

const barbershops = new PrismaBarbershopRepository(prisma);
const services = new PrismaServiceRepository(prisma);
const barbers = new PrismaBarberRepository(prisma);
const accounts = new BetterAuthAccountService();

export const useCases = {
  getBarbershop: new GetBarbershop(barbershops),
  updateBarbershop: new UpdateBarbershop(barbershops),
  listServices: new ListServices(services),
  createService: new CreateService(services),
  updateService: new UpdateService(services),
  listBarbers: new ListBarbers(barbers),
  listActiveBarbers: new ListActiveBarbers(barbers),
  createBarber: new CreateBarber(barbers, accounts),
  updateBarber: new UpdateBarber(barbers),
  enableOwnerBarberProfile: new EnableOwnerBarberProfile(barbers),
};
