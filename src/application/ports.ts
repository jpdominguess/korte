import type { AppointmentDTO, BarberDTO, BarbershopDTO, BlockDTO, ClientOptionDTO, PlanDTO, ServiceDTO } from "./dto";
import type { Plan } from "@/domain/entities/plan";
import type { Subscription, SubscriptionProps } from "@/domain/entities/subscription";
import type { Appointment } from "@/domain/entities/appointment";
import type { Payment } from "@/domain/entities/payment";
import type { WorkInterval } from "@/domain/entities/work-schedule";
import type { TimeRange } from "@/domain/services/availability-calculator";
import type { Role } from "@/domain/entities/user";
import type { ServiceProps } from "@/domain/entities/service";

export type BarbershopData = Omit<BarbershopDTO, "id">;

export interface BarbershopRepository {
  get(): Promise<BarbershopDTO | null>;
  update(data: BarbershopData): Promise<void>;
}

export interface ServiceRepository {
  list(filter?: { onlyActive?: boolean }): Promise<ServiceDTO[]>;
  findById(id: string): Promise<ServiceDTO | null>;
  create(data: ServiceProps, barberIds: string[]): Promise<string>;
  update(id: string, data: ServiceProps, barberIds: string[]): Promise<void>;
}

export interface BarberUpdate {
  name: string;
  phone: string | null;
  active: boolean;
  serviceIds: string[];
}

export interface BarberRepository {
  list(filter?: { onlyActive?: boolean }): Promise<BarberDTO[]>;
  findById(id: string): Promise<BarberDTO | null>;
  findByUserId(userId: string): Promise<BarberDTO | null>;
  create(userId: string, serviceIds: string[]): Promise<string>;
  update(id: string, data: BarberUpdate): Promise<void>;
  setActive(id: string, active: boolean): Promise<void>;
}

export interface WorkScheduleRepository {
  listForBarber(barberProfileId: string): Promise<WorkInterval[]>;
  listAll(): Promise<Array<WorkInterval & { barberProfileId: string }>>;
  replace(barberProfileId: string, intervals: WorkInterval[]): Promise<void>;
}

export interface PeriodFilter {
  from: Date;
  to: Date;
  barberProfileId?: string;
}

export interface NewScheduleBlock {
  barberProfileId: string;
  startsAt: Date;
  endsAt: Date;
  reason: string | null;
}

export interface ScheduleBlockRepository {
  list(filter: PeriodFilter): Promise<BlockDTO[]>;
  findById(id: string): Promise<BlockDTO | null>;
  create(data: NewScheduleBlock): Promise<string>;
  delete(id: string): Promise<void>;
}

export interface ClientRepository {
  list(): Promise<ClientOptionDTO[]>;
  findById(id: string): Promise<ClientOptionDTO | null>;
}

export interface NewAppointment {
  barberProfileId: string;
  serviceId: string;
  clientId: string | null;
  walkInName: string | null;
  walkInPhone: string | null;
  startsAt: Date;
  endsAt: Date;
}

export interface AppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  findDetails(id: string): Promise<AppointmentDTO | null>;
  listByClient(clientId: string): Promise<AppointmentDTO[]>;
  /** Grava a mudança de situação; lança conflito se o agendamento já tiver sido encerrado. */
  saveStatus(appointment: Appointment): Promise<void>;
  list(filter: PeriodFilter): Promise<AppointmentDTO[]>;
  listBusyRanges(barberProfileId: string, from: Date, to: Date): Promise<TimeRange[]>;
  /** Grava o agendamento; lança conflito se o banco detectar sobreposição. */
  create(data: NewAppointment): Promise<string>;
}

export interface NewPayment {
  appointmentId: string | null;
  subscriptionId: string | null;
  payment: Payment;
}

export interface PaymentRepository {
  create(data: NewPayment): Promise<void>;
}

export interface PlanRepository {
  list(filter?: { onlyActive?: boolean }): Promise<PlanDTO[]>;
  findById(id: string): Promise<Plan | null>;
  create(plan: Plan): Promise<string>;
  update(id: string, plan: Plan): Promise<void>;
}

export interface SubscriptionRow extends SubscriptionProps {
  clientName: string;
  clientPhone: string | null;
  planName: string;
  planPrice: number;
}

export type NewSubscription = Omit<SubscriptionProps, "id" | "canceledAt">;

export interface SubscriptionRepository {
  list(): Promise<SubscriptionRow[]>;
  findById(id: string): Promise<Subscription | null>;
  findActiveByClient(clientId: string, today: string): Promise<Subscription | null>;
  findLatestRowByClient(clientId: string): Promise<SubscriptionRow | null>;
  create(data: NewSubscription): Promise<string>;
  save(subscription: Subscription): Promise<void>;
  /** Incrementa o uso de forma atômica e registra qual atendimento o consumiu. */
  registerUse(subscriptionId: string, appointmentId: string, usedAt: Date): Promise<void>;
}

export interface TransactionRepositories {
  appointments: AppointmentRepository;
  payments: PaymentRepository;
  subscriptions: SubscriptionRepository;
}

/** Executa a operação em uma única transação do banco. */
export interface UnitOfWork {
  run<T>(work: (repositories: TransactionRepositories) => Promise<T>): Promise<T>;
}

export interface NewAccount {
  name: string;
  email: string;
  phone: string | null;
  password: string;
  role: Role;
}

export interface AccountService {
  /** Cria o usuário pelo mesmo mecanismo de autenticação do cadastro público. */
  createCredentialAccount(account: NewAccount): Promise<string>;
}

export interface EmailMessage {
  to: { email: string; name: string };
  subject: string;
  html: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}
