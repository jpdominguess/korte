import { redirect } from "next/navigation";

/** O agendamento acontece na própria página da barbearia. */
export default function AgendarPage() {
  redirect("/#agendar");
}
