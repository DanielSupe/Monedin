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
