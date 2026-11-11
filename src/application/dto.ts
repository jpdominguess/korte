import type { AppointmentStatus } from "@/domain/entities/appointment";
import type { PaymentMethod } from "@/domain/entities/payment";
import type { SubscriptionSituation } from "@/domain/entities/subscription";
import type { WorkInterval } from "@/domain/entities/work-schedule";

export interface BarbershopDTO {
  id: string;
  name: string;
  cep: string | null;
  street: string | null;
  number: string | null;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  logoUrl: string | null;
}

export interface ServiceDTO {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number;
  active: boolean;
  barberIds: string[];
}

export interface BarberDTO {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  active: boolean;
  isOwner: boolean;
  serviceIds: string[];
}

export interface PublicBarberDTO {
  id: string;
  name: string;
  serviceIds: string[];
  workdays: number[];
}

export interface PlanDTO {
  id: string;
  name: string;
  price: number;
  usesPerCycle: number;
  active: boolean;
  serviceIds: string[];
  serviceNames: string[];
  activeSubscribers: number;
}

export interface SubscriptionDTO {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  planId: string;
  planName: string;
  planPrice: number;
  cycleStart: string;
  cycleEnd: string;
  totalUses: number;
  usedUses: number;
  remainingUses: number;
  canceledAt: Date | null;
  situation: SubscriptionSituation;
}

export interface ClientSubscriptionDTO extends SubscriptionDTO {
  coveredServiceIds: string[];
}

export interface SubscriptionCoverageDTO {
  planName: string;
  remainingUses: number;
  totalUses: number;
  cycleEnd: string;
  covered: boolean;
}

export interface PublicPageDTO {
  barbershop: BarbershopDTO | null;
  services: ServiceDTO[];
  barbers: PublicBarberDTO[];
  plans: Array<Omit<PlanDTO, "activeSubscribers">>;
  openingHours: string | null;
  openNow: boolean;
  statusDetail: string | null;
}

export interface AppointmentDTO {
  id: string;
  barberProfileId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  durationMin: number;
  clientId: string | null;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  startsAt: Date;
  endsAt: Date;
  status: AppointmentStatus;
  paidAmount: number | null;
  paymentMethod: PaymentMethod | null;
  coveredBySubscription: boolean;
}

export interface OwnerDashboardDTO {
  month: string;
  periodEnd: string;
  revenue: { total: number; appointments: number; subscriptions: number };
  completed: { total: number; paid: number; covered: number };
  subscriptions: { active: number; paymentsInMonth: number };
  daily: Array<{ date: string; amount: number }>;
  chartTotal: number;
  averagePerOpenDay: number;
  bestDay: { date: string; amount: number } | null;
  barbers: Array<{ id: string; name: string; completed: number; share: number; revenue: number }>;
}

export interface ClientOptionDTO {
  id: string;
  name: string;
  phone: string | null;
}

export interface BlockDTO {
  id: string;
  barberProfileId: string;
  startsAt: Date;
  endsAt: Date;
  reason: string | null;
}

export interface AgendaDTO {
  appointments: AppointmentDTO[];
  blocks: BlockDTO[];
  workIntervals: Array<WorkInterval & { barberProfileId: string }>;
}
