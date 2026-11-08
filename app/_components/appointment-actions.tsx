import { ConfirmButton } from "./confirm-button";

export function AppointmentActions({ appointmentId }: { appointmentId: string }) {
  return (
    <div className="col-span-3 mt-2 flex flex-wrap items-center gap-2">
      <ConfirmButton url={`/api/agendamentos/${appointmentId}/cancelar`} label="Cancelar" confirmLabel="Confirmar cancelamento" />
    </div>
  );
}
