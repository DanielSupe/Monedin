import { Link } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { contar } from "../../lib/plural.js";
import { useSession } from "../auth/use-session.js";
import { Tutorial } from "../tutorial/Tutorial.js";
import { CHILD_STEPS } from "../tutorial/steps.js";
import {
  Card,
  Coins,
  HeroPanel,
  IconTile,
  Mascota,
  ProgressRing,
  Skeleton,
} from "../../ui/index.js";
import { LeaveProfile } from "../auth/LeaveProfile.js";
import { useOwnTasks } from "../tasks/use-tasks.js";
import { useOwnRewards } from "../rewards/use-rewards.js";
import { GoalPanel } from "../rewards/GoalPanel.js";
import { avanceDeTareas } from "./home-data.js";
/*
 * Los iconos salen de `app/nav-icons` y NO de un archivo nuevo aquí.
 *
 * Ya hay dos archivos de iconos duplicados en el proyecto —el de navegación y el
 * del acceso—, y su duplicación tiene dueño escrito: `polish-brand-and-a11y`
 * unifica el sistema de iconos. Crear un TERCERO para no cruzar una frontera que
 * nadie prohíbe empeoraría justo lo que ese change existe para arreglar.
 *
 * `features/` ya importa de `app/` en el chat, con `useIsWide`. Lo que la
 * frontera prohíbe es lo contrario: que `app/` conozca `features/`.
 */
import {
  IconProfile,
  IconRedemptions,
  IconRewards,
  IconTasks,
} from "../../app/nav-icons.js";

/**
 * El inicio del niño: su saldo, qué le toca hacer, y hacia dónde va.
 *
 * EL SALDO ES LO PRIMERO Y LO MÁS GRANDE, y eso no se negocia: es lo que el
 * producto entero existe para enseñar. La escala del niño lleva `--text-hero` en
 * 4rem precisamente para este número.
 *
 * Las referencias visuales de `design/ui/` lo movían a una píldora en la
 * cabecera de todas sus pantallas, y eso se revirtió: un saldo que te sigue a
 * todas partes convierte el marco en un tablero de puntuación, y le dice al niño
 * que lo que importa es la cifra y no lo que está haciendo. El inicio es el sitio
 * donde lo mira a propósito; en las otras pantallas está haciendo otra cosa.
 *
 * Lo que sí ganó esta pantalla en `redesign-child-screens` es CONTENIDO. Era un
 * número y cuatro destinos, así que un niño que entraba a ver qué le tocaba tenía
 * que dar un paso más para averiguarlo. Ahora lo dice aquí: lo que le queda por
 * hacer, y cuál es el premio que tiene más cerca.
 */

/** Los cuatro destinos, con su icono. Los mismos que el cajón lateral. */
const DESTINOS = [
  { to: "/me/tasks", Icono: IconTasks, texto: messages.tasks.myTasksTitle, ancla: "child-tasks" },
  {
    to: "/me/rewards",
    Icono: IconRewards,
    texto: messages.rewards.myRewardsTitle,
    ancla: "child-rewards",
  },
  {
    to: "/me/redemptions",
    Icono: IconRedemptions,
    texto: messages.redemptions.myRedemptionsTitle,
    ancla: undefined,
  },
  {
    to: "/me/settings",
    Icono: IconProfile,
    texto: messages.children.myProfileTitle,
    ancla: undefined,
  },
] as const;

export function ChildHome({ name, coins }: { name: string; coins: number }): React.ReactElement {
  const actor = useSession().session?.actor;
  const tareas = useOwnTasks();
  const premios = useOwnRewards();

  const suyas = tareas.data?.items ?? [];
  const avance = avanceDeTareas(suyas);
  const pendientes = suyas.filter((tarea) => tarea.status === "PENDING");

  const ofrecidos = premios.data?.items ?? [];

  return (
    <section className="mx-auto flex w-full max-w-reading flex-col gap-5">
      {/* Igual que en el panel del padre: decide la pantalla, no el recorrido. */}
      {actor?.tutorialSeen === false && <Tutorial steps={CHILD_STEPS} />}

      {/* `data-tutorial`: lo que ilumina el recorrido de bienvenida. */}
      <div data-tutorial="child-balance" className="flex flex-col gap-5">
        <Card>
          <div className="flex flex-col items-center gap-1 py-2">
            <p className="text-body text-ink-muted">
              {messages.children.homeGreeting} {name}
            </p>
            <Coins amount={coins} size="hero" />
            <p className="text-small text-ink-muted">{messages.children.homeBalanceLabel}</p>

            {/*
              Desde el SALDO y no desde un quinto destino en la barra: tocar el
              número y preguntar de dónde viene es el gesto natural, y añadirle un
              destino más a una navegación de cuatro le cuesta a alguien de seis
              años. Ver la decisión 6 del design de `add-coin-history`.
            */}
            <Link to="/me/coins" search={{ page: 1 }} className="text-small">
              {messages.coins.seeHistory}
            </Link>
          </div>
        </Card>

        {/*
          Monedín dice qué le queda, y el aro cuánto lleva. Las dos cosas juntas
          porque son la misma pregunta: «¿qué hago ahora?».

          El aro solo se monta si tiene tareas: un aro de cero sobre cero no dice
          nada y ocupa el sitio de lo que sí.
        */}
        {!tareas.isPending && (
          <HeroPanel
            mascot={<Mascota pose="saluda" size="large" />}
            aside={
              avance.total > 0 ? (
                <ProgressRing done={avance.done} total={avance.total} className="size-28" />
              ) : undefined
            }
          >
            <p className="text-lead font-extrabold text-ink-inverted">
              {messages.children.homeGreetingLead}
            </p>
            <p className="text-body text-ink-inverted opacity-90">
              {pendientes.length === 0
                ? messages.children.homeAllDone
                : `${messages.parents.pendingTitle} ${contar(
                    pendientes.length,
                    messages.children.homePendingOne,
                    messages.children.homePendingMany,
                  )}. ${messages.children.homeMarkExplains}`}
            </p>
          </HeroPanel>
        )}
      </div>

      {/*
        Lo que le queda por hacer, SIN salir del inicio. Solo las pendientes: una
        lista con lo aprobado dentro contesta «qué hice» y no «qué hago ahora».
      */}
      {tareas.isPending ? (
        <Skeleton lines={3} />
      ) : (
        pendientes.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-lead font-extrabold">{messages.children.homeTasksTitle}</h2>
              <Link to="/me/tasks" className="text-small ml-auto font-bold">
                {messages.children.homeTasksAll}
              </Link>
            </div>

            <ul className="flex list-none flex-col gap-2 p-0">
              {pendientes.slice(0, 3).map((tarea) => (
                <li key={tarea.id}>
                  <Link
                    to="/me/tasks"
                    className="rounded-card flex items-center gap-3 border border-border bg-surface-raised p-3 text-ink no-underline shadow-card transition duration-normal hover:bg-surface-sunken"
                  >
                    <IconTile tone="action">
                      <IconTasks />
                    </IconTile>
                    <span className="text-body min-w-0 flex-1 truncate font-bold">
                      {tarea.title}
                    </span>
                    <Coins amount={tarea.coins} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      )}

      {/*
        La otra mitad del ciclo: para qué sirven las monedas.

        Los dos casos sin meta se distinguen a propósito. Que le alcancen TODOS se
        celebra; no tener NINGÚN premio ofrecido no se dibuja, porque son
        situaciones contrarias y tratarlas igual diría que no hay nada que
        conseguir cuando lo que pasa es lo opuesto.
      */}
      {!premios.isPending && <GoalPanel rewards={ofrecidos} balance={coins} />}

      {/*
        Tarjetas y no una lista de enlaces subrayados: quien usa esta pantalla
        tiene entre seis y once años y la abre en una tablet compartida, donde
        un enlace de una línea es un objetivo de la altura de una letra.

        Cada tarjeta es UN solo elemento interactivo, como las teselas de la
        rejilla de perfiles.
      */}
      <ul className="grid list-none grid-cols-2 gap-3 p-0">
        {DESTINOS.map((destino) => (
          <li key={destino.to} data-tutorial={destino.ancla}>
            <Link
              to={destino.to}
              className="rounded-card flex h-full flex-col items-center justify-center gap-2 border border-border bg-surface-raised p-4 text-center text-body font-semibold text-ink no-underline shadow-card transition duration-normal hover:bg-surface-sunken motion-safe:hover:scale-105"
            >
              <IconTile tone="waiting">
                <destino.Icono />
              </IconTile>
              {destino.texto}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex justify-center">
        <LeaveProfile />
      </div>
    </section>
  );
}
