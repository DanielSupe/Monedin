import { ChangePinScreen } from "../auth/ChangePinScreen.js";
import { ParentAvatarScreen } from "../auth/ParentAvatarScreen.js";
import { ParentIdentity } from "../auth/ParentIdentity.js";
import { SignOut } from "../auth/SignOut.js";
import { ReplayTour } from "../tutorial/ReplayTour.js";
import { messages } from "../../lib/messages.js";

/**
 * La cuenta del padre: su foto, su PIN y cerrar sesión.
 *
 * VIVE AQUÍ Y NO EN SU ARCHIVO DE RUTA, que es donde estaba. Un archivo de ruta
 * monta el destino y no lo dibuja: dentro de uno, esta pantalla no se prueba sin
 * router, no se reutiliza y crece hasta que nadie recuerda que ese archivo era
 * una ruta. Es la misma mudanza que `redesign-child-home` le hizo a los dos
 * inicios.
 *
 * Los TRES enlaces de «Volver» que traían sus pantallas se quedan en cero: el
 * logo del marco lleva al inicio y es la salida que el padre usa en todas las
 * demás.
 */
export function AccountScreen(): React.ReactElement {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
          {messages.nav.parentAccountLead}
        </span>
        <h2 className="text-display font-extrabold">{messages.nav.parentAccount}</h2>
      </div>

      {/*
        De quién es la cuenta, y ANTES que nada que cambie una credencial: la
        pantalla tiene que responder «¿en qué cuenta estoy?» antes de dejar tocar
        el PIN. Ver la decisión 2 del design de `polish-profile-and-reward-image`.
      */}
      <ParentIdentity />

      {/*
        Dos columnas donde hay ancho, una debajo de otra donde no. A la izquierda
        lo que se cambia a menudo —la foto—, a la derecha lo que toca una
        credencial. Y cerrar sesión al final de su columna, lejos del resto: es
        lo único de esta pantalla que obliga a teclear correo y contraseña para
        volver.
      */}
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <ParentAvatarScreen />

        <div className="flex flex-col gap-5">
          <ChangePinScreen />
          <ReplayTour />
          <SignOut />
        </div>
      </div>
    </section>
  );
}
