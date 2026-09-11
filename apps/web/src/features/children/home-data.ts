import type { OwnReward, OwnTask } from "@monedin/contracts";

/**
 * Lo que el inicio del niño ENSEÑA y la API no devuelve tal cual.
 *
 * Vive en `features/` y no en `ui/` porque sabe qué es una tarea y qué es un
 * premio. Una pieza del sistema no conoce el dominio: por eso `ProgressRing`
 * recibe dos cifras en vez de calcularlas.
 *
 * Funciones puras y aparte del componente para poder probar los casos límite sin
 * montar una pantalla — que es donde están los errores de verdad, no en el caso
 * feliz.
 */

export interface Avance {
  done: number;
  total: number;
}

/**
 * Cuánto lleva hecho de sus tareas.
 *
 * Una tarea MARCADA cuenta como hecha, y es una decisión de producto: desde el
 * punto de vista del niño él ya hizo su parte, y que falte aprobarla es trabajo
 * de otro. Lo que la cifra mide es lo suyo.
 *
 * Y NO recorta por jornada. La referencia visual decía «hechas hoy», pero una
 * tarea no tiene concepto de día: solo una fecha límite opcional que, por
 * decisión del producto, ni caduca ni avisa. Las tres formas de fabricar ese
 * «hoy» fallan —por fecha límite saldría casi siempre cero de cero porque es
 * opcional, por fecha de creación desaparecería la tarea repartida ayer y sin
 * hacer, y una jornada nueva sería un cambio de modelo disfrazado de detalle
 * visual—. Ver `design/ui/datos-derivados.md`.
 */
export function avanceDeTareas(tasks: OwnTask[]): Avance {
  return {
    done: tasks.filter((task) => task.status !== "PENDING").length,
    total: tasks.length,
  };
}

/**
 * La meta más cercana: el premio más barato de los que TODAVÍA no alcanza.
 *
 * Cada premio ya dice cuánto le falta, pero ninguno dice cuál está más cerca, y
 * esa es la pregunta que convierte un saldo en una decisión de ahorro: no
 * «cuánto tengo» sino «qué consigo antes».
 *
 * Con dos al mismo precio DESEMPATA por identificador. Sin desempate, el panel
 * cambiaría de premio entre dos recargas sin que haya pasado nada — el mismo bug
 * clásico que obliga a desempatar cualquier orden de este proyecto.
 *
 * Devuelve `null` en los dos casos sin meta, que la pantalla distingue: si le
 * alcanzan TODOS no hay nada que perseguir y se celebra; si no tiene NINGÚN
 * premio ofrecido, no hay nada que enseñar. Son situaciones contrarias y se leen
 * distinto.
 */
export function metaMasCercana(rewards: OwnReward[]): OwnReward | null {
  const fuera = rewards.filter((reward) => !reward.affordable);

  return (
    fuera.reduce<OwnReward | null>((mejor, reward) => {
      if (mejor === null) return reward;
      if (reward.coins !== mejor.coins) return reward.coins < mejor.coins ? reward : mejor;
      return reward.id < mejor.id ? reward : mejor;
    }, null) ?? null
  );
}

/** Las tres etapas, en el orden del CICLO y no del volumen. */
export const ETAPAS = ["PENDING", "COMPLETED", "APPROVED"] as const;

export type Etapa = (typeof ETAPAS)[number];

export interface Grupo {
  etapa: Etapa;
  tasks: OwnTask[];
}

/**
 * Las tareas del niño, por la etapa en la que están.
 *
 * Las tres etapas son la máquina de estados que el producto protege con
 * transiciones condicionales y pruebas de doble tap, y en pantalla no se veían:
 * una columna con una insignia por fila obliga a leer cada insignia para saber
 * qué se puede hacer.
 *
 * UN GRUPO VACÍO NO SE DEVUELVE. La pantalla de un niño que no tiene nada
 * pendiente tiene que verse tranquila, no llena de ceros — es la misma regla que
 * ya cumple el panel del padre con sus avisos.
 *
 * Y el orden es el del ciclo, NUNCA el del volumen. Ordenar por cantidad haría
 * que la pantalla cambiara de forma cada día, y de una pantalla se aprende dónde
 * están las cosas.
 */
export function porEtapa(tasks: OwnTask[]): Grupo[] {
  return ETAPAS.map((etapa) => ({
    etapa,
    tasks: tasks.filter((task) => task.status === etapa),
  })).filter((grupo) => grupo.tasks.length > 0);
}
