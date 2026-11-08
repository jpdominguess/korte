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
