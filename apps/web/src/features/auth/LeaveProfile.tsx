import { messages } from "../../lib/messages.js";
import { Button } from "../../ui/index.js";
import { useLeaveProfile } from "./use-session.js";

/**
 * Volver a la rejilla.
 *
 * No navega: salir pone el actor a nulo, y la guarda de la ruta reevaluada
 * manda sola a la rejilla. Lo mismo vale para cerrar sesión.
 *
 * Traía un respaldo `mt-4` —la traducción literal del `marginTop: "1rem"` que
 * tuvo suelto— con la condición escrita de que existía «solo mientras quien la
 * usa siga sin vestir». `redesign-parent-home` vistió al último de sus dos
 * usuarios, así que el respaldo se va y la pieza declara su propia variante,
 * como `SignOut`.
 */
export function LeaveProfile(): React.ReactElement {
  const leave = useLeaveProfile();

  return (
    <Button variant="secondary" pending={leave.isPending} onClick={() => leave.mutate()}>
      {messages.auth.changeProfile}
    </Button>
  );
}
