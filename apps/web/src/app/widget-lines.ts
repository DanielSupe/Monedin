import type { FamilyRole } from "@monedin/contracts";
import { POSES } from "../ui/mascot-poses.js";
import { messages } from "../lib/messages.js";

/**
 * Qué dice Monedín, según dónde está y quién lo mira.
 *
 * CUELGA DEL ÁREA Y NO DE LA DIRECCIÓN, y esa es la decisión que sostiene todo
 * lo demás. Un objeto con una entrada por dirección se desincroniza en cuanto
 * alguien renombra una ruta, y el typecheck no lo ve: es el defecto que
 * `fullBleed` ya evitó declarándose EN la ruta en vez de en un `if` sobre la
 * URL.
 *
 * `areaOf` reparte por PREFIJOS, así que `/me/tasks` y `/tasks` caen en la misma
 * área y una ruta nueva de un área existente hereda sus frases sin que nadie se
 * acuerde de añadirla.
 *
 * Y `Record<FamilyRole, Record<Area, …>>` es el MECANISMO, no una elección de
 * estilo: un área nueva **no compila** hasta que los dos roles la cubren. Es la
 * diferencia entre una regla que vive en un documento y una que se hace cumplir
 * con una herramienta.
 */

export type Area =
  | "home"
  | "tasks"
  | "rewards"
  | "redemptions"
  | "children"
  | "account"
  | "help";

export interface WidgetLine {
  text: string;
  /** Decorativa: lo que dice algo es el texto. */
  image: string;
}

/**
 * En qué área de la aplicación estamos.
 *
 * Por prefijos y en orden: los más largos primero, para que `/me/rewards` no
 * caiga en el área del inicio por empezar por `/me`.
 *
 * Lo que NO está aquí cae en el inicio, y es el comportamiento correcto: una
 * pantalla nueva sin área asignada dice algo genérico en vez de quedarse muda.
 */
const PREFIJOS: Array<[string, Area]> = [
  ["/me/tasks", "tasks"],
  ["/me/rewards", "rewards"],
  ["/me/redemptions", "redemptions"],
  ["/me/settings", "account"],
  ["/me/coins", "account"],
  ["/tasks", "tasks"],
  ["/rewards", "rewards"],
  ["/redemptions", "redemptions"],
  ["/children", "children"],
  ["/account", "account"],
  ["/help", "help"],
  ["/assistant", "help"],
];

export function areaOf(pathname: string): Area {
  for (const [prefijo, area] of PREFIJOS) {
    if (pathname === prefijo || pathname.startsWith(`${prefijo}/`)) {
      return area;
    }
  }

  return "home";
}

/**
 * Dónde Monedín NO se ofrece.
 *
 * En la ayuda ya hay un enlace al chat con el mismo nombre, así que el widget
 * sería el segundo camino idéntico al mismo sitio en la misma pantalla: ruido, y
 * un `getByRole` ambiguo esperando a morder a cualquier test futuro. Lo decide
 * la misma función que elige la frase, para que no haya dos sitios donde mirar.
 */
export function offersAssistant(area: Area): boolean {
  return area !== "help";
}

const w = messages.widget;

export const LINES: Record<FamilyRole, Record<Area, WidgetLine[]>> = {
  CHILD: {
    home: [
      { text: w.childHomeBalance, image: POSES.miraElSaldo },
      { text: w.childHomeAsk, image: POSES.presenta },
      { text: w.childHomeCycle, image: POSES.idea },
    ],
    tasks: [
      { text: w.childTasksDo, image: POSES.corre },
      { text: w.childTasksApproval, image: POSES.explica },
    ],
    rewards: [
      { text: w.childRewardsChoose, image: POSES.elige },
      { text: w.childRewardsGoal, image: POSES.alcanzaLaMeta },
    ],
    redemptions: [
      { text: w.childRedemptionsWait, image: POSES.duda },
      { text: w.childRedemptionsWhy, image: POSES.explica },
    ],
    // Un niño no gestiona hijos, pero el tipo exige cubrir el área: si algún día
    // llegara ahí por una dirección escrita a mano, dice algo suyo.
    children: [{ text: w.childHomeAsk, image: POSES.presenta }],
    account: [
      { text: w.childAccountPin, image: POSES.idea },
      { text: w.childAccountAvatar, image: POSES.sorpresa },
    ],
    help: [{ text: w.childHelp, image: POSES.presenta }],
  },
  PARENT: {
    home: [
      { text: w.parentHomePending, image: POSES.explica },
      { text: w.parentHomeAsk, image: POSES.presenta },
    ],
    tasks: [
      { text: w.parentTasksApprove, image: POSES.idea },
      { text: w.parentTasksConflict, image: POSES.duda },
    ],
    rewards: [
      { text: w.parentRewardsPrice, image: POSES.elige },
      { text: w.parentRewardsRetire, image: POSES.explica },
    ],
    redemptions: [
      { text: w.parentRedemptionsFrozen, image: POSES.idea },
      { text: w.parentRedemptionsReject, image: POSES.duda },
    ],
    children: [
      { text: w.parentChildrenPin, image: POSES.explica },
      { text: w.parentChildrenBalance, image: POSES.miraElSaldo },
    ],
    account: [
      { text: w.parentAccountLeave, image: POSES.idea },
      { text: w.parentAccountAsk, image: POSES.presenta },
    ],
    help: [{ text: w.parentHelp, image: POSES.presenta }],
  },
};

/**
 * Cada cuánto cambia lo que dice.
 *
 * Constante del módulo y NO un token de `tokens.css`: `--duration-*` es para
 * transiciones —cuánto tarda algo en moverse— y esto es cuánto se queda quieto
 * entre una frase y la siguiente. Meterlo ahí lo pondría al lado de valores que
 * la escala del niño reasigna, y esto no cambia con la audiencia.
 *
 * Es un número de ARRANQUE, no medido. Se ajusta abriendo la aplicación.
 */
export const WIDGET_ROTATION_MS = 8_000;
