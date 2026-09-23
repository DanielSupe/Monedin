import { PHOTO_MAX_DIMENSION, type OwnTask } from "@monedin/contracts";
import { useState } from "react";
import * as api from "../../api/tasks.js";
import { messages } from "../../lib/messages.js";
import { contar } from "../../lib/plural.js";
import {
  Alert,
  Badge,
  Button,
  Card,
  Coins,
  EmptyState,
  Skeleton,
} from "../../ui/index.js";
import type { BadgeTone } from "../../ui/index.js";
import { ImageUploadField } from "../uploads/ImageUploadField.js";
import { avanceDeTareas, porEtapa, type Etapa } from "../children/home-data.js";
import {
  ProgressRing,
  HeroPanel,
  Mascota,
  IconTile,
  SplitLayout,
} from "../../ui/index.js";
import { fechaLarga } from "../../lib/dates.js";
import {
  describeTasksError,
  useCompleteTask,
  useOwnTasks,
} from "./use-tasks.js";

/**
 * Las tareas de un niño.
 *
 * Sin repartos y sin hermanos: el reparto es una noción de la gestión del padre
 * y no significa nada aquí. El perfil sale de la sesión, así que esta pantalla
 * no tiene ningún identificador que pudiera apuntar a otro niño.
 */
export function MyTasks(): React.ReactElement {
  const { data, isPending, error } = useOwnTasks();

  if (isPending) {
    return <Skeleton lines={4} />;
  }

  if (error) {
    return <Alert tone="danger">{describeTasksError(error)}</Alert>;
  }

  const tareas = data?.items ?? [];
  const pendientes = tareas.filter(
    (tarea) => tarea.status === "PENDING",
  ).length;
  const grupos = porEtapa(tareas);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-display font-extrabold">
          {messages.tasks.myTasksTitle}
        </h2>

        {/*
          Se cuentan las PENDIENTES, no las tareas.

          Una lista con ocho tareas de las que siete están aprobadas no es una
          lista de ocho cosas por hacer, y esta pantalla responde a «¿qué hago
          ahora?». Se cuentan las filas con ese estado y NUNCA el total.
        */}
        {tareas.length > 0 && (
          <p className="text-small text-ink-muted">
            {pendientes === 0
              ? messages.tasks.nothingPending
              : contar(
                  pendientes,
                  messages.tasks.pendingCountOne,
                  messages.tasks.pendingCountMany,
                )}
          </p>
        )}
      </div>

      {/*
        LA BANDA: la lista a la izquierda y, a la derecha, cuánto lleva y cómo
        funciona el ciclo. Es el reparto de su maqueta.

        El orden del DOCUMENTO no cambia con esto: el `aside` va después, así que
        quien recorre la pantalla con teclado sigue encontrando primero lo que
        tiene por hacer y después lo que lo explica — que es lo que ya decía la
        cabecera de `ComoFunciona` y sigue valiendo.
      */}
      <SplitLayout
        aside={
          <>
            {/*
              Cuánto lleva, sin contar las filas. Y sin la palabra «hoy»: una tarea
              no tiene concepto de jornada, así que decirlo sería enseñar como dato
              algo que el modelo no sabe. Ver `design/ui/datos-derivados.md`.
            */}
            {tareas.length > 0 && (
              <AvanceDelCiclo tareas={tareas} pendientes={pendientes} />
            )}

            <ComoFunciona />
          </>
        }
      >
        {tareas.length === 0 ? (
          <EmptyState glyph="🧹" title={messages.tasks.myTasksEmpty} />
        ) : (
          /*
          Agrupadas por ETAPA, que es lo que decide qué se puede hacer con cada
          una. Antes eran una columna con una insignia por fila, así que la
          máquina de estados que el producto protege con transiciones
          condicionales no se veía por ninguna parte.

          Un grupo vacío no llega hasta aquí: `porEtapa` no lo devuelve.
        */
          <div className="flex flex-col gap-6">
            {grupos.map((grupo) => (
              <section key={grupo.etapa} className="flex flex-col gap-3">
                <h3 className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
                  {TITULO_GRUPO[grupo.etapa]} · {grupo.tasks.length}
                </h3>

                <ul className="flex list-none flex-col gap-3 p-0">
                  {grupo.tasks.map((tarea) => (
                    <MyTaskRow key={tarea.id} task={tarea} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </SplitLayout>
    </section>
  );
}

/**
 * Cuánto lleva del ciclo, en la columna de apoyo.
 *
 * Se extrae porque el cuerpo de la pantalla ya no lo puede llevar en línea: va
 * dentro del hueco `aside`, y un bloque de veinte líneas ahí dentro esconde el
 * reparto, que es lo único que esa llamada tiene que dejar ver.
 */
function AvanceDelCiclo({
  tareas,
  pendientes,
}: {
  tareas: OwnTask[];
  pendientes: number;
}): React.ReactElement {
  const avance = avanceDeTareas(tareas);

  return (
    <HeroPanel
      mascot={
        <Mascota pose={pendientes === 0 ? "celebra" : "corre"} size="medium" />
      }
      aside={
        <ProgressRing
          done={avance.done}
          total={avance.total}
          className="size-24"
        />
      }
    >
      {/*
            UNA frase, y la que la cabecera no dice. El título ya está en el
            `h2` y la cuenta de pendientes justo al lado: repetir cualquiera de
            las dos aquí sería decir lo mismo dos veces en la misma pantalla.
          */}
      <p className="text-lead font-extrabold text-ink-inverted">
        {pendientes === 0
          ? messages.children.homeAllDone
          : messages.children.homeMarkExplains}
      </p>
    </HeroPanel>
  );
}

/**
 * EL CICLO, CONTADO AL NIÑO.
 *
 * Lo mismo que explica el formulario del padre, y van los DOS a propósito: el
 * que reparte necesita saber que marcar no paga, y el que marca necesita saber
 * que su papá o su mamá lo revisan antes. Contárselo a uno solo deja al otro
 * suponiendo — y es justo donde un niño se lleva el chasco: marca, no ve subir
 * sus monedas, y cree que se perdieron.
 *
 * Va al FINAL y no arriba: lo primero que quiere ver es qué tiene por hacer, no
 * una explicación. Quien la necesita la encuentra después de mirar la lista, que
 * es cuando aparece la duda.
 */
function ComoFunciona(): React.ReactElement {
  const pasos = [
    `${messages.tasks.howDoLead}${messages.tasks.markDone}${messages.tasks.howDoTail}`,
    messages.tasks.howReview,
    messages.tasks.howApproved,
  ];

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <h3 className="text-title font-extrabold">{messages.tasks.howTitle}</h3>

        <ol className="flex list-none flex-col gap-3 p-0">
          {pasos.map((paso, indice) => (
            <li key={paso} className="flex items-center gap-3">
              <span className="rounded-pill text-body grid size-8 shrink-0 place-items-center bg-primary-soft font-extrabold text-primary-hover">
                {indice + 1}
              </span>
              <span className="text-body text-ink">{paso}</span>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

/**
 * Cómo se encabeza cada grupo.
 *
 * Son las mismas etapas que las insignias de cada fila, dichas como encabezado
 * de una lista y no como estado: «Por hacer» encabeza, «Pendiente» describe.
 */
const TITULO_GRUPO: Record<Etapa, string> = {
  PENDING: messages.tasks.groupPending,
  COMPLETED: messages.tasks.groupCompleted,
  APPROVED: messages.tasks.groupApproved,
};

/**
 * Cómo se lee cada etapa del ciclo.
 *
 * Los tres estados ya tienen tono en el sistema y no se inventa paleta:
 * pendiente es neutro —está por hacer—, esperando revisión es información —no
 * hay nada que hacer, solo esperar— y aprobada es éxito.
 *
 * Antes las tres se veían igual: un rectángulo con borde gris y un párrafo. La
 * máquina de estados que el producto protege con transiciones condicionales y
 * pruebas de doble tap no se veía por ninguna parte.
 */
const TONO: Record<OwnTask["status"], BadgeTone> = {
  PENDING: "neutral",
  COMPLETED: "info",
  APPROVED: "done",
};

const ETIQUETA: Record<OwnTask["status"], string> = {
  PENDING: messages.tasks.statusPending,
  COMPLETED: messages.tasks.statusCompleted,
  APPROVED: messages.tasks.statusApproved,
};

function MyTaskRow({ task }: { task: OwnTask }): React.ReactElement {
  const complete = useCompleteTask();
  // La foto se sube ANTES de marcar: aquí solo se guarda su clave hasta que el
  // niño pulsa. Si nunca la sube, se marca igual y `evidenceUploadKey` no viaja.
  const [evidencia, setEvidencia] = useState<string | undefined>();

  return (
    <li>
      <Card>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <IconTile tone={TONO_TESELA[task.status]}>
              <IconoEtapa status={task.status} />
            </IconTile>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-lead font-bold">{task.title}</p>
              {task.description !== null && (
                <p className="text-small text-ink-muted">{task.description}</p>
              )}
            </div>
            <Badge tone={TONO[task.status]}>{ETIQUETA[task.status]}</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Coins amount={task.coins} />
            {task.dueDate !== null && (
              <span className="text-small text-ink-muted">
                {messages.tasks.dueLabel} {fechaLarga(task.dueDate)}
              </span>
            )}
          </div>

          {/*
            Solo una tarea PENDIENTE ofrece marcarla, que es exactamente lo que
            la API permite: la transición sale de `PENDING` y cualquier otra
            cosa acaba en 409. Lo que se ve y lo que se puede hacer van juntos.
          */}
          {task.status === "PENDING" && (
            <div className="flex flex-col gap-2">
              {/* Opcional a propósito: enseñar el trabajo, no un peaje para
                  declararlo hecho. */}
              <ImageUploadField
                requestUploadUrl={(contentType) =>
                  api.requestEvidenceUploadUrl(task.id, contentType)
                }
                onUploaded={setEvidencia}
                /*
                  SIN `aspect`: una evidencia no se recorta. Se mira de una en
                  una en la bandeja del padre, no junto a otras del mismo
                  tamaño, y lo que hay que ver es el conjunto — la cama hecha,
                  la mesa recogida. Es la mitad de la decisión original que
                  `crop-reward-images` conserva.
                */
                maxDimension={PHOTO_MAX_DIMENSION}
                label={messages.tasks.addEvidence}
              />
              {evidencia !== undefined && (
                <p className="text-small text-done">
                  {messages.tasks.evidenceReady}
                </p>
              )}

              <Button
                variant="primary"
                block
                pending={complete.isPending}
                onClick={() =>
                  complete.mutate({
                    taskId: task.id,
                    ...(evidencia === undefined
                      ? {}
                      : { evidenceUploadKey: evidencia }),
                  })
                }
              >
                {messages.tasks.markDone}
              </Button>
            </div>
          )}

          {task.evidence !== null && (
            <img
              src={task.evidence}
              alt={messages.tasks.evidenceAlt}
              className="rounded-card max-w-full self-start object-cover"
            />
          )}

          {/* Marcarla no paga: lo que sigue es que su padre la revise. */}
          {task.status === "COMPLETED" && (
            <p className="text-small text-ink-muted">
              {messages.tasks.waitingReview}
            </p>
          )}

          {task.status === "APPROVED" && (
            <p className="text-small font-semibold text-done">
              {messages.tasks.earned}
            </p>
          )}

          {complete.error !== null && (
            <Alert tone="danger">{describeTasksError(complete.error)}</Alert>
          )}
        </div>
      </Card>
    </li>
  );
}

/** El tinte de la tesela sigue a la etapa, con los tonos del sistema. */
const TONO_TESELA: Record<OwnTask["status"], "action" | "waiting" | "saving"> =
  {
    PENDING: "action",
    COMPLETED: "waiting",
    APPROVED: "saving",
  };

/**
 * El icono de una etapa. Decorativo: lo que dice en qué punto está la tarea es
 * su insignia, que se queda.
 */
function IconoEtapa({
  status,
}: {
  status: OwnTask["status"];
}): React.ReactElement {
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
      {status === "PENDING" && (
        <>
          <path d="M4 20l6-6" />
          <path d="M12 12l4-4" />
          <path d="M14.5 4.5l5 5-6 2-1-1z" />
        </>
      )}
      {status === "COMPLETED" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </>
      )}
      {status === "APPROVED" && <path d="M5 12.5l4.5 4.5L19 7.5" />}
    </svg>
  );
}
