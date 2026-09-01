import { createFileRoute } from "@tanstack/react-router";
import { requireParent } from "../app/guards.js";
import { ChangePinScreen } from "../features/auth/ChangePinScreen.js";
import { ParentAvatarScreen } from "../features/auth/ParentAvatarScreen.js";
import { SignOut } from "../features/auth/SignOut.js";
import { messages } from "../lib/messages.js";

/**
 * La cuenta del padre: su foto, su PIN y cerrar sesión.
 *
 * Era la ÚLTIMA ruta con estilo en línea de las veintidós, y sus dos pantallas
 * eran las últimas huérfanas de la lista de deuda: cuelgan del avatar del marco
 * y no son tareas, ni premios, ni hijos, así que ningún change de área las
 * reclamaba nunca. Entran aquí por lo mismo que «Mi perfil» del niño entró con
 * sus tareas.
 *
 * Los TRES enlaces de «Volver» que traían entre las dos se quedan en cero: el
 * logo del marco lleva al inicio y es la salida que el padre usa en todas las
 * demás pantallas.
 */
export const Route = createFileRoute("/account")({
  beforeLoad: ({ context }) => requireParent(context.queryClient),
  component: AccountRoute,
});

function AccountRoute(): React.ReactElement {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-title font-bold">{messages.nav.parentAccount}</h2>

      <ParentAvatarScreen />
      <ChangePinScreen />

      {/*
        Cerrar sesión vive AQUÍ desde `redesign-parent-home`, y no en el inicio
        al lado de cambiar de perfil. Se parecen y no lo son: cambiar de perfil
        devuelve a la rejilla varias veces al día y sin credenciales para volver;
        esto obliga a teclear correo y contraseña. Juntas e iguales es como un
        padre acaba tecleando su contraseña porque quería pasarle la tablet a su
        hijo.
      */}
      <SignOut />
    </section>
  );
}
