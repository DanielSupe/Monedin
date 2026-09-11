import { Link } from "@tanstack/react-router";
import type { Child } from "@monedin/contracts";
import { messages } from "../../lib/messages.js";
import { useSession } from "../auth/use-session.js";
import { Tutorial } from "../tutorial/Tutorial.js";
import { PARENT_STEPS } from "../tutorial/steps.js";
import {
  Alert,
  Avatar,
  Card,
  Coins,
  HeroPanel,
  IconTile,
  Skeleton,
  buttonClasses,
} from "../../ui/index.js";
import type { HeroTone } from "../../ui/index.js";
import { LeaveProfile } from "../auth/LeaveProfile.js";
import { useParentConsole, type Recuento } from "./use-parent-console.js";

/**
 * El panel del padre: qué le espera y cómo van sus hijos.
 *
 * Hasta `redesign-parent-home` esta pantalla era una lista de cinco enlaces, y
 * los cinco eran exactamente los de la barra de su marco. No estaba sin vestir:
 * estaba sin CONTENIDO. Vestirla con tarjetas la habría dejado igual de vacía,
 * solo más grande.
 *
 * Lo que un padre necesita al abrir Monedín es saber si hay algo esperándole:
 * él es la mitad autorizadora del ciclo —el niño marca, él aprueba, y solo
 * entonces se acreditan monedas—. El vocabulario ya lo decía sin que nadie lo
 * cobrara: `messages.nav.parentHome` vale «Panel», no «Inicio».
 *
 * El panel NO resuelve nada. Aprobar y rechazar es trabajo de la bandeja, y
 * cada aviso lleva a la suya con el filtro ya puesto.
 */
export function ParentConsole({ name }: { name: string }): React.ReactElement {
  const actor = useSession().session?.actor;
  const { tasksToApprove, redemptionsWaiting, children, isPending, error } = useParentConsole();

  if (isPending) {
    return <Skeleton lines={5} />;
  }

  if (error != null) {
    return <Alert tone="danger">{messages.parents.consoleFailed}</Alert>;
  }

  const sinNada = tasksToApprove.value === 0 && redemptionsWaiting.value === 0;

  return (
    <section className="flex flex-col gap-6">
      {/*
        QUIÉN decide si se ve: esta pantalla, mirando el actor. El recorrido no
        consulta la sesión — recibe su guion y avisa al terminar—, y por eso se
        prueba montándolo con un guion cualquiera y sin servidor.
      */}
      {actor?.tutorialSeen === false && <Tutorial steps={PARENT_STEPS} />}

      <h2 className="text-display font-extrabold">
        {messages.parents.greeting} {name}
      </h2>

      {/* `data-tutorial`: el recorrido de bienvenida ilumina esta sección. Es un
          ancla y no una referencia encadenada — quien monta el recorrido no es
          quien dibuja cada trozo. */}
      <section data-tutorial="parent-pending" className="flex flex-col gap-3">
        <h3 className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
          {messages.parents.pendingTitle}
        </h3>

        {/*
          Un aviso con cero no se dibuja, y con las dos bandejas vacías va una
          sola frase: leer dos ceros para concluir lo que una frase dice de un
          vistazo es trabajo que el panel existe para ahorrar. Y estar al día es
          la situación NORMAL, no un caso degenerado.
        */}
        {sinNada ? (
          <Card>
            <p className="text-body text-ink-muted">{messages.parents.allClear}</p>
          </Card>
        ) : (
          /*
            Los dos avisos LADO A LADO donde hay ancho: son dos bandejas
            distintas y ninguna manda sobre la otra, y apilarlas hace que la
            segunda parezca la consecuencia de la primera.
          */
          <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
            {tasksToApprove.value > 0 && (
              <li>
                <PendingLink
                  to="/tasks"
                  search={{ page: 1, status: "COMPLETED" }}
                  tone="action"
                  icon={<IconoTareas />}
                  count={tasksToApprove}
                  one={messages.parents.taskToApprove}
                  many={messages.parents.tasksToApprove}
                />
              </li>
            )}

            {redemptionsWaiting.value > 0 && (
              <li>
                <PendingLink
                  to="/redemptions"
                  search={{ page: 1, status: "PENDING" }}
                  tone="saving"
                  icon={<IconoCanjes />}
                  count={redemptionsWaiting}
                  one={messages.parents.redemptionWaiting}
                  many={messages.parents.redemptionsWaiting}
                />
              </li>
            )}
          </ul>
        )}
      </section>

      <section data-tutorial="parent-children" className="flex flex-col gap-3">
        <h3 className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
          {messages.parents.childrenTitle}
        </h3>

        <Card>
          {children.length === 0 ? (
            <p className="text-body text-ink-muted">{messages.parents.childrenEmpty}</p>
          ) : (
            /*
              Las filas NO son enlaces. Adónde lleva pulsar un hijo —a editarlo,
              a sus tareas, a su historial— lo deciden `redesign-parent-children`
              y `add-coin-history`, y elegirlo aquí sería fijarlo desde la
              pantalla que menos sabe. El bloque entero lleva a `/children`.
            */
            <ul className="flex list-none flex-col gap-3 p-0">
              {children.map((hijo) => (
                <ChildBalance key={hijo.id} child={hijo} />
              ))}
            </ul>
          )}
        </Card>

        <Link to="/children" search={{ page: 1 }} className={buttonClasses("secondary")}>
          {messages.parents.childrenLink}
        </Link>
      </section>

      {/*
        Cambiar de perfil se queda; cerrar sesión se mudó a `/account`. Se
        parecen y no lo son: esto devuelve a la rejilla varias veces al día y sin
        credenciales para volver, y aquello obliga a teclear correo y contraseña.
        Juntas e iguales es como un padre acaba tecleando su contraseña porque
        quería pasarle la tablet a su hijo.
      */}
      <LeaveProfile />
    </section>
  );
}

/**
 * Un aviso de bandeja: la cifra, qué es, y adónde lleva.
 *
 * Lleva al listado CON el filtro aplicado. Llevarlo sin filtro obligaría al
 * padre a repetir a mano la búsqueda que el panel acaba de hacer por él; que se
 * pueda es consecuencia de que el filtro viaje en la dirección, y este es el
 * primer sitio que lo aprovecha.
 *
 * Es UN solo elemento interactivo, como las teselas de la rejilla de perfiles.
 */
function PendingLink({
  to,
  search,
  tone,
  icon,
  count,
  one,
  many,
}: {
  to: "/tasks" | "/redemptions";
  search: { page: number; status: "COMPLETED" | "PENDING" };
  /** Tareas en el tono de la ACCIÓN; canjes en el del AHORRO. */
  tone: HeroTone;
  icon: React.ReactElement;
  count: Recuento;
  one: string;
  many: string;
}): React.ReactElement {
  return (
    /*
      EL ENLACE SE ESTIRA SOBRE EL PANEL, y sigue siendo UNO.

      `HeroPanel` dibuja una `<section>` y no puede navegar, así que el enlace va
      dentro y cubre la superficie con `after:inset-0`. Se consigue lo de siempre
      —toda la tarjeta responde al toque— sin ninguna de las dos formas que este
      proyecto ya descartó: un `<Link>` envolviendo un panel anidaría dos
      interactivos, y darle a `HeroPanel` la capacidad de navegar la obligaría a
      saber de rutas, que es justo lo que `ui/` no sabe.
    */
    <HeroPanel tone={tone} className="motion-safe:transition-transform motion-safe:hover:scale-105">
      <IconTile tone="hero">{icon}</IconTile>

      <Link
        to={to}
        search={search}
        className="flex min-w-0 flex-1 flex-col text-ink-inverted no-underline after:absolute after:inset-0"
      >
        <span className="text-display font-extrabold leading-none">
          {/* El `+` dice «al menos»: la cuenta se quedó corta y no lo esconde. */}
          {count.value}
          {count.exact ? "" : "+"}
        </span>
        <span className="text-body font-bold opacity-90">
          {count.value === 1 && count.exact ? one : many}
        </span>
      </Link>

      <Flecha />
    </HeroPanel>
  );
}

/** Las dos marcas de una lista revisada. Decorativa. */
function IconoTareas(): React.ReactElement {
  return (
    <Glifo>
      <path d="M4 7.5l2.5 2.5L11 5" />
      <path d="M13.5 8h7" />
      <path d="M4 17.5L6.5 20 11 15" />
      <path d="M13.5 18h7" />
    </Glifo>
  );
}

/** Un vale con su muesca. Decorativa. */
function IconoCanjes(): React.ReactElement {
  return (
    <Glifo>
      <path d="M3 8.5a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 3v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-3z" />
      <path d="M9.5 9.5v5" />
    </Glifo>
  );
}

/** Adónde lleva. Decorativa: lo dice el enlace. */
function Flecha(): React.ReactElement {
  return (
    <span className="relative shrink-0 text-ink-inverted">
      <Glifo>
        <path d="M9 6l6 6-6 6" />
      </Glifo>
    </span>
  );
}

/** El lienzo común de los tres dibujos de esta pantalla. */
function Glifo({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function ChildBalance({ child }: { child: Child }): React.ReactElement {
  return (
    <li className="flex min-w-0 items-center gap-3">
      <Avatar value={child.avatar} size="small" />
      <span className="min-w-0 flex-1 truncate text-body font-semibold">{child.name}</span>
      <Coins amount={child.coins} />
    </li>
  );
}
