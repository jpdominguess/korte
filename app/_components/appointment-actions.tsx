import { Check } from "lucide-react";
import { ConfirmButton } from "./confirm-button";
import { LinkButton } from "./ui";

export function AppointmentActions({ appointmentId, started }: { appointmentId: string; started: boolean }) {
  return (
    <div className="col-span-3 mt-2 flex flex-wrap items-center gap-2">
      <LinkButton href={`/agenda/${appointmentId}/concluir`} size="sm">
        <Check />
        Concluir
      </LinkButton>
      {started && <ConfirmButton url={`/api/agendamentos/${appointmentId}/falta`} label="Marcar falta" confirmLabel="Confirmar falta" />}
      <ConfirmButton url={`/api/agendamentos/${appointmentId}/cancelar`} label="Cancelar" confirmLabel="Confirmar cancelamento" />
    </div>
  );
}
