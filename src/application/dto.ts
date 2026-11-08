import type { AppointmentStatus } from "@/domain/entities/appointment";
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

export interface PublicPageDTO {
  barbershop: BarbershopDTO | null;
  services: ServiceDTO[];
  barbers: PublicBarberDTO[];
  openingHours: string | null;
  openNow: boolean;
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
