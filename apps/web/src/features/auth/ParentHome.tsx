import { Link } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { useLogout } from "./use-session.js";

/**
 * El inicio del padre: sus cuatro áreas de gestión y su cuenta.
 *
 * Se mudó aquí desde `routes/index.tsx` en `redesign-child-home`, SIN tocar su
 * aspecto: sacar las dos pantallas del archivo de ruta y vestir solo una es lo
 * que permite saber si algo se movió al mudarlo o al vestirlo. Vestir esta es
 * `redesign-parent-home`, y ese change decidirá si merece un sitio propio o se
 * queda con el resto de lo que depende del actor.
 */
export function ParentHome(): React.ReactElement {
  const logout = useLogout();

  return (
    <>
      {/*
        Las clases son la traducción LITERAL de los estilos en línea que traía:
        `list-none p-0 grid gap-2` son `listStyle: none`, `padding: 0`,
        `display: grid` y `gap: 0.5rem`. Al salir del archivo de ruta quedó
        fuera de la excepción, y traducir no es vestir: esta pantalla sigue sin
        vestir y es de `redesign-parent-home`.
      */}
      <ul className="grid list-none gap-2 p-0">
        <li>
          <Link to="/tasks" search={{ page: 1, status: "ALL" }}>
            {messages.tasks.title}
          </Link>
        </li>
        <li>
          <Link to="/rewards" search={{ page: 1, status: "ACTIVE" }}>
            {messages.rewards.title}
          </Link>
        </li>
        <li>
          <Link to="/redemptions" search={{ page: 1, status: "ALL" }}>
            {messages.redemptions.title}
          </Link>
        </li>
        <li>
          <Link to="/children" search={{ page: 1 }}>
            {messages.children.title}
          </Link>
        </li>
        <li>
          <Link to="/account">{messages.auth.myAvatarTitle}</Link>
        </li>
      </ul>

      <button
        type="button"
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
        className="mt-4"
      >
        {messages.auth.signOut}
      </button>
    </>
  );
}
