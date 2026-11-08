import { GetBarbershop, UpdateBarbershop } from "@/application/use-cases/barbershop";
import { CreateService, ListServices, UpdateService } from "@/application/use-cases/catalog";
import {
  CreateBarber,
  EnableOwnerBarberProfile,
  ListBarbers,
  UpdateBarber,
} from "@/application/use-cases/team";
import { GetAgenda, GetAppointmentDetails } from "@/application/use-cases/agenda";
import { CreateAppointment, GetAvailableSlots } from "@/application/use-cases/booking";
import { GetPublicPage } from "@/application/use-cases/public-page";
import { GetWorkSchedule, SetWorkSchedule } from "@/application/use-cases/work-schedule";
import { BetterAuthAccountService } from "./auth/better-auth-account-service";
import { prisma } from "./prisma/client";
import { PrismaBarberRepository } from "./repositories/prisma-barber-repository";
import { PrismaAppointmentRepository } from "./repositories/prisma-appointment-repository";
import { PrismaBarbershopRepository } from "./repositories/prisma-barbershop-repository";
import { PrismaScheduleBlockRepository } from "./repositories/prisma-schedule-block-repository";
import { PrismaWorkScheduleRepository } from "./repositories/prisma-work-schedule-repository";
import { PrismaServiceRepository } from "./repositories/prisma-service-repository";

const barbershops = new PrismaBarbershopRepository(prisma);
const services = new PrismaServiceRepository(prisma);
const barbers = new PrismaBarberRepository(prisma);
const workSchedules = new PrismaWorkScheduleRepository(prisma);
const blocks = new PrismaScheduleBlockRepository(prisma);
const appointments = new PrismaAppointmentRepository(prisma);
const accounts = new BetterAuthAccountService();
const availableSlots = new GetAvailableSlots(services, barbers, workSchedules, blocks, appointments);

export const useCases = {
  getBarbershop: new GetBarbershop(barbershops),
  updateBarbershop: new UpdateBarbershop(barbershops),
  listServices: new ListServices(services),
  createService: new CreateService(services),
  updateService: new UpdateService(services),
  listBarbers: new ListBarbers(barbers),
  createBarber: new CreateBarber(barbers, accounts),
  updateBarber: new UpdateBarber(barbers),
  enableOwnerBarberProfile: new EnableOwnerBarberProfile(barbers),
  getPublicPage: new GetPublicPage(barbershops, services, barbers, workSchedules),
  getWorkSchedule: new GetWorkSchedule(workSchedules),
  setWorkSchedule: new SetWorkSchedule(barbers, workSchedules),
  getAvailableSlots: availableSlots,
  createAppointment: new CreateAppointment(services, availableSlots, appointments),
  getAgenda: new GetAgenda(appointments, blocks, workSchedules),
  getAppointmentDetails: new GetAppointmentDetails(appointments),
};
