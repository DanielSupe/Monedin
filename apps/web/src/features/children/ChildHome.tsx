import { Link } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { Card, Coins, buttonClasses } from "../../ui/index.js";
import { LeaveProfile } from "../auth/LeaveProfile.js";

/**
 * El inicio del niño: su saldo y sus cuatro destinos.
 *
 * El saldo es lo PRIMERO y lo más grande. Es lo que el producto entero existe
 * para enseñar —las tareas valen monedas, los premios cuestan monedas— y hasta
 * `redesign-child-home` salía en negrita dentro de una frase, al mismo tamaño
 * que los enlaces de al lado. La escala del niño lleva `--text-hero` en 4rem
 * desde `add-design-system` precisamente para este número, y esta pantalla no
 * la usaba.
 *
 * Se queda AQUÍ y no en la cabecera del marco. Tenerlo siempre a la vista
 * convertiría el marco en un tablero; el inicio es el sitio donde el niño mira
 * su saldo a propósito, y en las otras tres pantallas está haciendo otra cosa.
 * `add-app-shell` dejó esa pregunta anotada para este change, y esta es la
 * respuesta. Ver la decisión 2 de su design.
 */

/** Los cuatro destinos, con su glifo. Los mismos que la barra de abajo. */
const DESTINOS = [
  { to: "/me/tasks", glifo: "🧹", texto: messages.tasks.myTasksTitle },
  { to: "/me/rewards", glifo: "🎁", texto: messages.rewards.myRewardsTitle },
  { to: "/me/redemptions", glifo: "🎟️", texto: messages.redemptions.myRedemptionsTitle },
  { to: "/me/settings", glifo: "🙂", texto: messages.children.myProfileTitle },
] as const;

export function ChildHome({
  name,
  coins,
}: {
  name: string;
  coins: number;
}): React.ReactElement {
  return (
    <section className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-col items-center gap-1 py-2">
          <p className="text-body text-ink-muted">
            {messages.children.homeGreeting} {name}
          </p>
          <Coins amount={coins} size="hero" />
          <p className="text-small text-ink-muted">{messages.children.homeBalanceLabel}</p>
        </div>
      </Card>

      {/*
        Tarjetas y no una lista de enlaces subrayados: quien usa esta pantalla
        tiene entre seis y once años y la abre en una tablet compartida, donde
        un enlace de una línea es un objetivo de la altura de una letra.

        Cada tarjeta es UN solo elemento interactivo, como las teselas de la
        rejilla de perfiles.
      */}
      <ul className="grid list-none grid-cols-2 gap-3 p-0">
        {DESTINOS.map((destino) => (
          <li key={destino.to}>
            <Link
              to={destino.to}
              className="rounded-card flex h-full flex-col items-center justify-center gap-2 border border-border bg-surface-raised p-4 text-center text-body font-semibold text-ink no-underline shadow-card transition duration-normal hover:bg-surface-sunken motion-safe:hover:scale-105"
            >
              <span aria-hidden="true" className="text-title leading-none">
                {destino.glifo}
              </span>
              {destino.texto}
            </Link>
          </li>
        ))}
      </ul>

      <LeaveProfile className={buttonClasses("secondary")} />
    </section>
  );
}
