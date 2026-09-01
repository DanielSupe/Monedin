import { messages } from "../../lib/messages.js";
import { Button } from "../../ui/index.js";
import { useLogout } from "./use-session.js";

/**
 * Cerrar sesión del todo.
 *
 * Hermana de `LeaveProfile` y deliberadamente NO su gemela: salir del perfil
 * devuelve a la rejilla y se vuelve sin credenciales; esto obliga a teclear
 * correo y contraseña otra vez. Por eso viven en pantallas distintas desde
 * `redesign-parent-home` —esta en la cuenta, aquella en el inicio— y esta lleva
 * la variante `danger`.
 *
 * Tampoco navega: cerrar sesión pone el actor a nulo y la guarda de la ruta
 * reevaluada manda sola a la puerta pública.
 */
export function SignOut(): React.ReactElement {
  const logout = useLogout();

  return (
    <Button variant="danger" pending={logout.isPending} onClick={() => logout.mutate()}>
      {messages.auth.signOut}
    </Button>
  );
}
