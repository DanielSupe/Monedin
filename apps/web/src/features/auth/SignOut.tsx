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
    <div className="flex flex-col items-start gap-2">
      <Button variant="danger" pending={logout.isPending} onClick={() => logout.mutate()}>
        {messages.auth.signOut}
      </Button>

      {/*
        LA CONSECUENCIA, ESCRITA, que es lo que faltaba.

        Que esto y salir del perfil no son lo mismo ya estaba decidido y ya
        estaban en pantallas distintas — pero eso lo sabe quien leyó la decisión,
        no quien mira el botón. La maqueta lo dice aquí, y dice lo único que hace
        falta saber antes de pulsar: que para volver hay que teclear el correo y
        la contraseña.

        El asistente tenía una frase parecida —«salir del perfil y cerrar sesión
        no son lo mismo»— y eso no contaba: una pista en un globo que hay que
        abrir no es lo que un botón irreversible tiene al lado.
      */}
      <p className="text-small text-ink-muted">{messages.auth.signOutConsequence}</p>
    </div>
  );
}
