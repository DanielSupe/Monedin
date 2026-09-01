import { messages } from "../../lib/messages.js";
import { useLeaveProfile } from "./use-session.js";

/**
 * Volver a la rejilla.
 *
 * No navega: salir pone el actor a nulo, y la guarda de la ruta reevaluada
 * manda sola a la rejilla. Lo mismo vale para cerrar sesión.
 */
export function LeaveProfile({ className }: { className?: string }): React.ReactElement {
  const leave = useLeaveProfile();

  return (
    <button
      type="button"
      disabled={leave.isPending}
      onClick={() => leave.mutate()}
      // `mt-4` son exactamente el `marginTop: "1rem"` que traía suelto: al
      // salir del archivo de ruta quedó fuera de la excepción de estilos en
      // línea, y la traducción es literal. Solo mientras quien la usa siga sin
      // vestir; el inicio del niño ya le pasa sus clases.
      className={className ?? "mt-4"}
    >
      {messages.auth.changeProfile}
    </button>
  );
}
