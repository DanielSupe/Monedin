import type { Pose } from "../../ui/mascot-poses.js";
import { messages } from "../../lib/messages.js";

/**
 * Los dos guiones del recorrido de bienvenida.
 *
 * SON DOS y no uno con ramas: lo que hay que explicarle a un adulto que
 * gestiona —dónde aprueba, dónde crea, dónde ve a sus hijos— no se parece a lo
 * que hay que explicarle a un niño de seis años —qué son esas monedas y cómo
 * consigue más—. Comparten el mecanismo y no el contenido, que es la relación
 * que el producto ya tiene entre sus dos escalas.
 *
 * TODAS LAS ANCLAS VIVEN EN LA PANTALLA DE INICIO. Ninguna apunta a la
 * navegación: en estrecho está detrás de un botón, así que la mitad de las
 * veces el objetivo no existiría — y justo en el dispositivo más probable.
 *
 * Un paso SIN ancla es legítimo y no un caso degenerado: el saludo y el cierre
 * no señalan a ninguna parte, y van centrados.
 */

export interface TutorialStep {
  /** Estable y único dentro de su guion. */
  key: string;
  /** El `data-tutorial` que ilumina, si ilumina alguno. */
  anchor?: string;
  title: string;
  body: string;
  /**
   * La ilustración que acompaña. Decorativa: lo que explica es el texto.
   *
   * Es el NOMBRE de una pose y no una ruta: pedir una que no existe deja de
   * compilar, y quien la dibuja es `Mascota` con las medidas del sistema. Antes
   * era una cadena, así que un guion podía apuntar a cualquier cosa.
   */
  pose: Pose;
}

export const PARENT_STEPS: TutorialStep[] = [
  {
    key: "bienvenida",
    title: messages.tutorial.parentWelcomeTitle,
    body: messages.tutorial.parentWelcomeBody,
    pose: "saluda",
  },
  {
    key: "pendientes",
    anchor: "parent-pending",
    title: messages.tutorial.parentPendingTitle,
    body: messages.tutorial.parentPendingBody,
    pose: "propone",
  },
  {
    key: "hijos",
    anchor: "parent-children",
    title: messages.tutorial.parentChildrenTitle,
    body: messages.tutorial.parentChildrenBody,
    pose: "explica",
  },
  {
    key: "crear",
    anchor: "parent-create",
    title: messages.tutorial.parentCreateTitle,
    body: messages.tutorial.parentCreateBody,
    pose: "senalaArriba",
  },
  {
    key: "final",
    title: messages.tutorial.parentDoneTitle,
    body: messages.tutorial.parentDoneBody,
    pose: "bienHecho",
  },
];

export const CHILD_STEPS: TutorialStep[] = [
  {
    key: "bienvenida",
    title: messages.tutorial.childWelcomeTitle,
    body: messages.tutorial.childWelcomeBody,
    pose: "saluda",
  },
  {
    key: "saldo",
    anchor: "child-balance",
    title: messages.tutorial.childBalanceTitle,
    body: messages.tutorial.childBalanceBody,
    pose: "presenta",
  },
  {
    key: "tareas",
    anchor: "child-tasks",
    title: messages.tutorial.childTasksTitle,
    body: messages.tutorial.childTasksBody,
    pose: "senalaAbajo",
  },
  {
    key: "premios",
    anchor: "child-rewards",
    title: messages.tutorial.childRewardsTitle,
    body: messages.tutorial.childRewardsBody,
    pose: "celebra",
  },
  {
    key: "final",
    title: messages.tutorial.childDoneTitle,
    body: messages.tutorial.childDoneBody,
    pose: "bienHecho",
  },
];
