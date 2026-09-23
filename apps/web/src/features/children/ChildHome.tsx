import { Link } from "@tanstack/react-router";
import type { OwnTask } from "@monedin/contracts";
import { hoyConDia } from "../../lib/dates.js";
import { messages } from "../../lib/messages.js";
import { contar } from "../../lib/plural.js";
import { useSession } from "../auth/use-session.js";
import { Tutorial } from "../tutorial/Tutorial.js";
import { CHILD_STEPS } from "../tutorial/steps.js";
import {
  Badge,
  Button,
  Card,
  Coins,
  HeroPanel,
  IconTile,
  Mascota,
  ProgressRing,
  Skeleton,
  SplitLayout,
} from "../../ui/index.js";
import { LeaveProfile } from "../auth/LeaveProfile.js";
import { useCompleteTask, useOwnTasks } from "../tasks/use-tasks.js";
import { useOwnRewards } from "../rewards/use-rewards.js";
import { useOwnCoinHistory } from "../coins/use-coins.js";
import { MovementRow } from "../coins/CoinHistory.js";
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
  {
    to: "/me/tasks",
    Icono: IconTasks,
    texto: messages.tasks.myTasksTitle,
    ancla: "child-tasks",
  },
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

export function ChildHome({
  name,
  coins,
}: {
  name: string;
  coins: number;
}): React.ReactElement {
  const actor = useSession().session?.actor;
  const tareas = useOwnTasks();
  const premios = useOwnRewards();

  const suyas = tareas.data?.items ?? [];
  const avance = avanceDeTareas(suyas);
  const pendientes = suyas.filter((tarea) => tarea.status === "PENDING");

  const ofrecidos = premios.data?.items ?? [];

  /*
   * LO QUE SE ENSEÑA EN EL INICIO, en el orden del ciclo y no el de la respuesta.
   *
   * Primero lo que se puede hacer ahora, después lo que espera revisión, y al
   * final lo ya cobrado. Cinco como mucho: el inicio es un resumen, y para verlo
   * entero está «Ver todas».
   */
  const enPortada = [
    ...pendientes,
    ...suyas.filter((tarea) => tarea.status === "COMPLETED"),
    ...suyas.filter((tarea) => tarea.status === "APPROVED"),
  ].slice(0, 5);

  return (
    /*
      SIN TOPE DE ANCHO DE LECTURA. Eran 640 px, razonables para una columna y una
      jaula para dos: dejaban la mitad del monitor vacía y las dos columnas a 300.
      El tope lo pone el marco, como en las otras cuatro pantallas de esta banda.
    */
    <section className="flex w-full flex-col gap-5">
      {/* Igual que en el panel del padre: decide la pantalla, no el recorrido. */}
      {actor?.tutorialSeen === false && <Tutorial steps={CHILD_STEPS} />}

      {/*
        LA CABECERA: quién eres a la izquierda, cuánto tienes a la derecha.

        Era una tarjeta centrada con la cifra a tamaño `hero`, que gastaba el
        tercio superior de la pantalla: en 950 px de alto empujaba las tareas por
        debajo del pliegue, así que lo primero que veía un niño al entrar era
        cuánto tiene y lo que venía a hacer había que buscarlo.

        El requisito decía que el saldo tenía que ser el elemento MÁS GRANDE, y se
        revirtió a conciencia en `match-child-home-header`. Lo que sustituye al
        tamaño es el SITIO: siempre la misma esquina, con su moneda al lado. La
        mitad del requisito que NO se cae sigue en pie — no va dentro de una frase,
        lo dibuja la pieza del sistema y se anuncia con su unidad.
      */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/*
            QUÉ DÍA ES, encima del saludo y como lo pone la maqueta. No afirma
            nada sobre las tareas de debajo — eso sería falso, porque el modelo no
            tiene jornada—: sitúa a quien mira, que en una tablet que se usa a
            ratos no es poco.
          */}
          <p className="text-small text-ink-muted first-letter:uppercase">
            {hoyConDia()}
          </p>
          <h2 className="text-display font-extrabold">
            {messages.children.homeGreeting} {name}
          </h2>
        </div>

        {/*
          LA PÍLDORA ES UN ENLACE, y la maqueta la dibuja estática.

          Aquí manda el requisito: el historial de un niño no tiene destino propio
          en su navegación —se llega desde aquí—, y hay un escenario vigente que
          dice que desde el inicio se abre de dónde salió cada moneda. Estática,
          ese camino se pierde para quien recorre con teclado. Una maqueta manda en
          el ASPECTO, no en los caminos que el producto garantiza.

          `data-tutorial` se muda con ella: el recorrido ilumina el saldo, y en la
          tarjeta que desaparece apuntaría a un hueco.
        */}
        <Link
          to="/me/coins"
          search={{ page: 1 }}
          data-tutorial="child-balance"
          aria-label={messages.coins.seeHistory}
          className="rounded-pill flex shrink-0 items-center gap-2 border border-border bg-surface-raised px-4 py-2 no-underline shadow-card"
        >
          <Coins amount={coins} size="large" />
          <span className="text-small text-ink-muted">
            {messages.children.homeBalanceLabel}
          </span>
        </Link>
      </div>

      <div className="flex flex-col gap-5">
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
                <ProgressRing
                  done={avance.done}
                  total={avance.total}
                  className="size-28"
                />
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
        LA BANDA: lo que hay que hacer a la izquierda, y a la derecha para qué
        sirve. Es el reparto de su maqueta, y el mismo que usan las otras cuatro
        pantallas de este change.

        El saldo y Monedín se quedan ARRIBA y a lo ancho, fuera de la banda: el
        saldo es el elemento más grande del inicio del niño por requisito vigente,
        y meterlo en una columna lo encogería a la mitad.
      */}
      <SplitLayout
        aside={
          <>
            {/*
              La otra mitad del ciclo: para qué sirven las monedas.

              Los dos casos sin meta se distinguen a propósito. Que le alcancen
              TODOS se celebra; no tener NINGÚN premio ofrecido no se dibuja,
              porque son situaciones contrarias y tratarlas igual diría que no hay
              nada que conseguir cuando lo que pasa es lo opuesto.
            */}
            {!premios.isPending && (
              <GoalPanel rewards={ofrecidos} balance={coins} />
            )}

            {/*
              LAS ÚLTIMAS MONEDAS. La tarjeta de arriba dice CUÁNTAS tiene y ofrece
              ir a ver de dónde salieron; esto enseña las tres últimas sin ir a
              ninguna parte, que es lo que cierra el ciclo en la pantalla donde
              empieza. La maqueta lo pone así, y en esta columna.
            */}
            <UltimasMonedas />

            {/* Cierra la columna de apoyo, de ancho completo y como segunda
                acción: es lo que dibuja su maqueta, y aquí no compite con nada. */}
            <LeaveProfile variant="secondary" block />
          </>
        }
      >
        {/*
        LO QUE PASA CON SUS TAREAS, no solo lo que le queda por hacer.

        Aquí decía «solo las pendientes: una lista con lo aprobado dentro contesta
        ‹qué hice› y no ‹qué hago ahora›». El argumento es bueno para una lista de
        trabajo y equivocado para ESTA pantalla, que es donde el ciclo se cierra:
        hice la tarea, la marqué, mi padre la aprobó, aquí están mis monedas. Con
        solo las pendientes, el último paso —el que da sentido a los otros tres—
        no se ve en ninguna parte del inicio.

        Lo que el argumento sí acertaba es el ORDEN, y se conserva: primero lo que
        se puede hacer ahora, después lo que espera, y al final lo cobrado. Cada
        estado trae además lo suyo —un botón, una espera o unas monedas—, que es
        lo que impide que la mezcla se lea como una lista plana.
      */}
        {tareas.isPending ? (
          <Skeleton lines={3} />
        ) : (
          enPortada.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="text-lead font-extrabold">
                  {messages.children.homeTasksTitle}
                </h2>
                <Link to="/me/tasks" className="text-small ml-auto font-bold">
                  {messages.children.homeTasksAll}
                </Link>
              </div>

              <ul className="flex list-none flex-col gap-2 p-0">
                {enPortada.map((tarea) => (
                  <FilaDelInicio key={tarea.id} task={tarea} />
                ))}
              </ul>
            </section>
          )
        )}

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
      </SplitLayout>
    </section>
  );
}

/**
 * UNA TAREA DEL INICIO, CON LO QUE LE CORRESPONDE POR SU ESTADO.
 *
 * Tres finales y no uno, porque son tres momentos distintos del ciclo y lo que
 * hay que hacer con cada uno es distinto: la pendiente se puede marcar, la
 * marcada solo se espera, y la aprobada ya pagó. Con el mismo final en las tres
 * la lista se leería plana y el ciclo no se vería.
 *
 * SOBRE EL BOTÓN, que antes era un enlace a otra pantalla.
 *
 * La fila llevaba a «Tareas» para marcarla allí. Eso convierte el gesto del
 * producto —«ya la hice»— en dos pasos y una pantalla intermedia, justo en el
 * sitio donde el niño ya está mirando la tarea. La maqueta pone el botón aquí.
 *
 * Y deja de ser un enlace por una razón más: un botón dentro de un enlace anida
 * dos elementos interactivos y se anuncia como «enlace que contiene un botón».
 * Para ir a la lista entera sigue estando «Ver todas», que es un enlace de
 * verdad y el único que hace falta.
 *
 * SIN subir foto: esto es el atajo. Quien quiera acompañarla con una foto va a
 * «Tareas», que es donde vive el subidor — meterlo también aquí duplicaría el
 * camino de una subida para ahorrar un toque.
 */
function FilaDelInicio({ task }: { task: OwnTask }): React.ReactElement {
  const complete = useCompleteTask();

  return (
    <li className="rounded-card flex flex-wrap items-center gap-3 border border-border bg-surface-raised p-3 shadow-card">
      <IconTile tone={task.status === "APPROVED" ? "coin" : "action"}>
        <IconTasks />
      </IconTile>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body truncate font-bold">{task.title}</span>

        {/* Lo que la tarea pide, cuando lo trae: «tender la cama» y «antes de ir
            al colegio» no son la misma instrucción. La maqueta la enseña aquí. */}
        {task.description !== null && task.status === "PENDING" && (
          <span className="text-small truncate text-ink-muted">
            {task.description}
          </span>
        )}

        {task.status === "COMPLETED" && (
          <span className="text-small text-ink-muted">
            {messages.tasks.waitingReview}
          </span>
        )}
        {/* Tono «hecho» y no el de la moneda, que es lo que usa la misma frase en
            «Tareas». La reserva del ámbar sigue en pie —la cazó su test— y dos
            pantallas que dicen lo mismo lo dicen igual. */}
        {task.status === "APPROVED" && (
          <span className="text-small font-bold text-done">
            {messages.tasks.earned}
          </span>
        )}
      </span>

      <Coins amount={task.coins} />

      {task.status === "PENDING" ? (
        <Button
          variant="primary"
          pending={complete.isPending}
          onClick={() => complete.mutate({ taskId: task.id })}
        >
          {messages.tasks.markDone}
        </Button>
      ) : (
        <Badge tone={task.status === "APPROVED" ? "done" : "info"}>
          {task.status === "APPROVED"
            ? messages.tasks.statusApproved
            : messages.tasks.statusCompleted}
        </Badge>
      )}
    </li>
  );
}

/**
 * LAS TRES ÚLTIMAS MONEDAS, sin salir del inicio.
 *
 * No duplica la pantalla de historial ni la sustituye: aquella pagina y explica
 * que el libro no se edita; esto son tres renglones para que el ciclo termine
 * donde empieza. Quien quiera el detalle tiene el enlace.
 *
 * Reutiliza la MISMA fila que el historial completo. Escribirla otra vez aquí
 * sería la tercera copia de «Ganó 5 · Por una tarea aprobada · Quedó con 128», y
 * la que se quedaría atrás al cambiar algo.
 */
function UltimasMonedas(): React.ReactElement | null {
  const { data, isPending } = useOwnCoinHistory({ page: 1 });
  const ultimos = (data?.items ?? []).slice(0, 3);

  if (isPending || ultimos.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-lead font-extrabold">
          {messages.children.homeCoinsTitle}
        </h2>
        <Link
          to="/me/coins"
          search={{ page: 1 }}
          className="text-small ml-auto font-bold"
        >
          {messages.children.homeCoinsAll}
        </Link>
      </div>

      <Card>
        <ul className="flex list-none flex-col p-0">
          {ultimos.map((movimiento) => (
            <MovementRow key={movimiento.id} movement={movimiento} compact />
          ))}
        </ul>
      </Card>
    </section>
  );
}
