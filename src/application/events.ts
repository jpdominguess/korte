export interface AppointmentCreated {
  type: "AppointmentCreated";
  appointmentId: string;
}

export type ApplicationEvent = AppointmentCreated;

export type EventHandler<E extends ApplicationEvent> = (event: E) => Promise<void>;

export interface EventPublisher {
  publish(event: ApplicationEvent): void;
}
