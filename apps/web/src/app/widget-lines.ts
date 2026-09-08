import type { FamilyRole } from "@monedin/contracts";
import agobio from "../assets/tutorial/alcanza-la-meta.png";
import corre from "../assets/tutorial/corre.png";
import duda from "../assets/tutorial/duda.png";
import elige from "../assets/tutorial/elige.png";
import explica from "../assets/tutorial/explica.png";
import idea from "../assets/tutorial/idea.png";
import miraElSaldo from "../assets/tutorial/mira-el-saldo.png";
import presenta from "../assets/tutorial/presenta.png";
import sorpresa from "../assets/tutorial/sorpresa.png";
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
      { text: w.childHomeBalance, image: miraElSaldo },
      { text: w.childHomeAsk, image: presenta },
      { text: w.childHomeCycle, image: idea },
    ],
    tasks: [
      { text: w.childTasksDo, image: corre },
      { text: w.childTasksApproval, image: explica },
    ],
    rewards: [
      { text: w.childRewardsChoose, image: elige },
      { text: w.childRewardsGoal, image: agobio },
    ],
    redemptions: [
      { text: w.childRedemptionsWait, image: duda },
      { text: w.childRedemptionsWhy, image: explica },
    ],
    // Un niño no gestiona hijos, pero el tipo exige cubrir el área: si algún día
    // llegara ahí por una dirección escrita a mano, dice algo suyo.
    children: [{ text: w.childHomeAsk, image: presenta }],
    account: [
      { text: w.childAccountPin, image: idea },
      { text: w.childAccountAvatar, image: sorpresa },
    ],
    help: [{ text: w.childHelp, image: presenta }],
  },
  PARENT: {
    home: [
      { text: w.parentHomePending, image: explica },
      { text: w.parentHomeAsk, image: presenta },
    ],
    tasks: [
      { text: w.parentTasksApprove, image: idea },
      { text: w.parentTasksConflict, image: duda },
    ],
    rewards: [
      { text: w.parentRewardsPrice, image: elige },
      { text: w.parentRewardsRetire, image: explica },
    ],
    redemptions: [
      { text: w.parentRedemptionsFrozen, image: idea },
      { text: w.parentRedemptionsReject, image: duda },
    ],
    children: [
      { text: w.parentChildrenPin, image: explica },
      { text: w.parentChildrenBalance, image: miraElSaldo },
    ],
    account: [
      { text: w.parentAccountLeave, image: idea },
      { text: w.parentAccountAsk, image: presenta },
    ],
    help: [{ text: w.parentHelp, image: presenta }],
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
