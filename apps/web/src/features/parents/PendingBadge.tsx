import { messages } from "../../lib/messages.js";
import { usePendingCounts } from "./use-parent-console.js";

/**
 * Cuánto espera en una bandeja, sobre su destino del lateral.
 *
 * VIVE EN `features/` Y NO EN EL MARCO, y ahí está toda la pieza: contar tareas
 * por aprobar es negocio —el listado del padre pagina por REPARTO, así que su
 * `total` cuenta repartos y hay que contar las filas con el estado buscado— y
 * el marco solo sabe de roles y de destinos. Entra como contenido, igual que
 * `Pagination` recibe sus enlaces.
 *
 * CON CERO NO SE DIBUJA. Es la misma regla que el panel: leer un cero para
 * concluir lo que la ausencia ya dice es trabajo que el lateral existe para
 * ahorrar, y una insignia permanente deja de significar nada.
 *
 * Y NO SE ANUNCIA COMO SI FUERA EL DESTINO. Lo que nombra el enlace es su texto;
 * la cifra se añade con su unidad —«3 por aprobar»— para que quien no ve la
 * pantalla no oiga «Tareas 3».
 */
export function PendingBadge({ kind }: { kind: "tasks" | "redemptions" }): React.ReactElement | null {
  const { tasksToApprove, redemptionsWaiting } = usePendingCounts();
  const cuenta = kind === "tasks" ? tasksToApprove : redemptionsWaiting;

  if (cuenta.value === 0) {
    return null;
  }

  // El `+` dice «al menos»: la cuenta se quedó corta y no lo esconde.
  const cifra = `${String(cuenta.value)}${cuenta.exact ? "" : "+"}`;

  return (
    <span className="rounded-pill text-micro ml-auto inline-flex min-w-6 shrink-0 items-center justify-center bg-conflict-soft px-2 py-0.5 font-extrabold text-conflict">
      <span aria-hidden="true">{cifra}</span>
      <span className="sr-only">
        {cifra} {messages.nav.pendingSuffix}
      </span>
    </span>
  );
}
