import type { BarberDTO, BarbershopDTO, ServiceDTO } from "./dto";
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
