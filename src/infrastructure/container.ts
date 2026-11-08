import { GetBarbershop, UpdateBarbershop } from "@/application/use-cases/barbershop";
import { CreateService, ListServices, UpdateService } from "@/application/use-cases/catalog";
import {
  CreateBarber,
  EnableOwnerBarberProfile,
  GetManagedBarbers,
  ListBarbers,
  UpdateBarber,
} from "@/application/use-cases/team";
import { SendAppointmentConfirmation } from "@/application/event-handlers/send-appointment-confirmation";
import {
  CancelAppointment,
  CompleteAppointment,
  GetAgenda,
  GetAppointmentDetails,
  ListClientAppointments,
  ListClients,
  MarkNoShow,
} from "@/application/use-cases/agenda";
import { CreateScheduleBlock, DeleteScheduleBlock } from "@/application/use-cases/blocks";
import { CreateAppointment, GetAvailableSlots } from "@/application/use-cases/booking";
import { GetPublicPage } from "@/application/use-cases/public-page";
import { GetWorkSchedule, SetWorkSchedule } from "@/application/use-cases/work-schedule";
import { BetterAuthAccountService } from "./auth/better-auth-account-service";
import { emailSender } from "./email";
import { AfterResponseEventPublisher } from "./events/after-response-event-publisher";
import { prisma } from "./prisma/client";
import { PrismaBarberRepository } from "./repositories/prisma-barber-repository";
import { PrismaAppointmentRepository } from "./repositories/prisma-appointment-repository";
import { PrismaBarbershopRepository } from "./repositories/prisma-barbershop-repository";
import { PrismaClientRepository } from "./repositories/prisma-client-repository";
import { PrismaScheduleBlockRepository } from "./repositories/prisma-schedule-block-repository";
import { PrismaWorkScheduleRepository } from "./repositories/prisma-work-schedule-repository";
import { PrismaServiceRepository } from "./repositories/prisma-service-repository";
import { PrismaUnitOfWork } from "./prisma/prisma-unit-of-work";

const barbershops = new PrismaBarbershopRepository(prisma);
const services = new PrismaServiceRepository(prisma);
const barbers = new PrismaBarberRepository(prisma);
const workSchedules = new PrismaWorkScheduleRepository(prisma);
const blocks = new PrismaScheduleBlockRepository(prisma);
const appointments = new PrismaAppointmentRepository(prisma);
const clients = new PrismaClientRepository(prisma);
const accounts = new BetterAuthAccountService();
const availableSlots = new GetAvailableSlots(services, barbers, workSchedules, blocks, appointments);
const unitOfWork = new PrismaUnitOfWork(prisma);
const events = new AfterResponseEventPublisher();
const sendConfirmation = new SendAppointmentConfirmation(appointments, barbershops, emailSender);
events.subscribe("AppointmentCreated", (event) => sendConfirmation.handle(event));

export const useCases = {
  getBarbershop: new GetBarbershop(barbershops),
  updateBarbershop: new UpdateBarbershop(barbershops),
  listServices: new ListServices(services),
  createService: new CreateService(services),
  updateService: new UpdateService(services),
  listBarbers: new ListBarbers(barbers),
  getManagedBarbers: new GetManagedBarbers(barbers),
  createBarber: new CreateBarber(barbers, accounts),
  updateBarber: new UpdateBarber(barbers),
  enableOwnerBarberProfile: new EnableOwnerBarberProfile(barbers),
  getPublicPage: new GetPublicPage(barbershops, services, barbers, workSchedules),
  getWorkSchedule: new GetWorkSchedule(workSchedules),
  setWorkSchedule: new SetWorkSchedule(barbers, workSchedules),
  getAvailableSlots: availableSlots,
  createAppointment: new CreateAppointment(services, clients, availableSlots, appointments, events),
  completeAppointment: new CompleteAppointment(unitOfWork),
  markNoShow: new MarkNoShow(appointments),
  cancelAppointment: new CancelAppointment(appointments),
  listClients: new ListClients(clients),
  listClientAppointments: new ListClientAppointments(appointments),
  createScheduleBlock: new CreateScheduleBlock(blocks, appointments),
  deleteScheduleBlock: new DeleteScheduleBlock(blocks),
  getAgenda: new GetAgenda(appointments, blocks, workSchedules),
  getAppointmentDetails: new GetAppointmentDetails(appointments),
};
