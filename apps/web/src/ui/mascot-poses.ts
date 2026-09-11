import agobio from "../assets/tutorial/agobio.png";
import alcanzaLaMeta from "../assets/tutorial/alcanza-la-meta.png";
import bienHecho from "../assets/tutorial/bien-hecho.png";
import celebra from "../assets/tutorial/celebra.png";
import corre from "../assets/tutorial/corre.png";
import duda from "../assets/tutorial/duda.png";
import duerme from "../assets/tutorial/duerme.png";
import elige from "../assets/tutorial/elige.png";
import enfado from "../assets/tutorial/enfado.png";
import explica from "../assets/tutorial/explica.png";
import idea from "../assets/tutorial/idea.png";
import llora from "../assets/tutorial/llora.png";
import miraElSaldo from "../assets/tutorial/mira-el-saldo.png";
import pena from "../assets/tutorial/pena.png";
import presenta from "../assets/tutorial/presenta.png";
import propone from "../assets/tutorial/propone.png";
import saluda from "../assets/tutorial/saluda.png";
import senalaAbajo from "../assets/tutorial/senala-abajo.png";
import senalaArriba from "../assets/tutorial/senala-arriba.png";
import sorpresa from "../assets/tutorial/sorpresa.png";

/**
 * Las veinte poses de Monedín, en un solo sitio.
 *
 * Mismo criterio que `avatars.ts`: este es el ÚNICO archivo que sabe qué imagen
 * corresponde a cada pose. Hasta ahora cuatro archivos repartidos por el
 * proyecto importaban los mismos PNG por su ruta —el widget, el recorrido, el
 * chat y la puerta pública—, así que el día que una ilustración cambie de nombre
 * hay que encontrarlos todos.
 *
 * Una pose se pide por lo que EXPRESA y no por dónde se usa: `duda` sirve igual
 * en el teclado del PIN que en un canje sin respuesta, y atarla a un sitio la
 * habría dejado inservible en el otro.
 *
 * El tipo es lo que hace cumplible que nadie invente una pose: pedir una que no
 * existe no compila.
 */
export const POSES = {
  agobio,
  alcanzaLaMeta,
  bienHecho,
  celebra,
  corre,
  duda,
  duerme,
  elige,
  enfado,
  explica,
  idea,
  llora,
  miraElSaldo,
  pena,
  presenta,
  propone,
  saluda,
  senalaAbajo,
  senalaArriba,
  sorpresa,
} as const;

export type Pose = keyof typeof POSES;
