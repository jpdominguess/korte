import { after } from "next/server";
import type { ApplicationEvent, EventHandler, EventPublisher } from "@/application/events";

/** Observer: as reações rodam depois da resposta, então uma falha no e-mail não afeta o agendamento. */
export class AfterResponseEventPublisher implements EventPublisher {
  private readonly handlers = new Map<ApplicationEvent["type"], Array<EventHandler<ApplicationEvent>>>();

  subscribe(type: ApplicationEvent["type"], handler: EventHandler<ApplicationEvent>) {
    this.handlers.set(type, [...(this.handlers.get(type) ?? []), handler]);
  }

  publish(event: ApplicationEvent) {
    for (const handler of this.handlers.get(event.type) ?? []) {
      after(() => handler(event).catch((error) => console.error(`Falha ao processar ${event.type}`, error)));
    }
  }
}
