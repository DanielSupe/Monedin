import { messages } from "../../lib/messages.js";
import { Coins } from "../../ui/index.js";

/**
 * El ciclo, contado como un flujo.
 *
 * SUSTITUYE a las tres tarjetas de promesa, no se suma a ellas: decían estas
 * mismas ideas —«Haz tus tareas», «Elige tu premio», «Tú apruebas»— y tener las
 * dos cosas era decirlo dos veces.
 *
 * Al fundirlas aparece lo que a la lista le faltaba: el ORDEN. Aprobar no es el
 * tercero de tres cosas sueltas, va ENTRE la tarea y las monedas, porque
 * aprobar es lo que acredita. Es la máquina de estados que la API protege con
 * transiciones condicionales, dibujada.
 *
 * El paso del padre rompe la simetría a propósito —lleva la superficie de la
 * marca y los otros tres no—: de los cuatro es el único suyo, y que se note es
 * medio argumento de la página.
 *
 * Ver la decisión 1 del design de `redesign-public-entry`.
 */

/** El saldo del paso de las monedas. Es un ejemplo, no el dato de nadie. */
const MONEDAS_DE_EJEMPLO = 20;

interface Paso {
  clave: string;
  glifo: string;
  titulo: string;
  cuerpo: string;
  /** El del padre. Cambia de superficie, que es lo que lo saca de la fila. */
  delPadre?: boolean;
  /** El de las monedas dibuja una cifra en vez de un glifo. */
  cifra?: boolean;
}

const PASOS: Paso[] = [
  {
    clave: "tarea",
    glifo: "🧹",
    titulo: messages.landing.howStepTaskTitle,
    cuerpo: messages.landing.howStepTaskBody,
  },
  {
    clave: "apruebas",
    glifo: "✓",
    titulo: messages.landing.howStepApproveTitle,
    cuerpo: messages.landing.howStepApproveBody,
    delPadre: true,
  },
  {
    clave: "monedas",
    glifo: "",
    titulo: messages.landing.howStepCoinsTitle,
    cuerpo: messages.landing.howStepCoinsBody,
    cifra: true,
  },
  {
    clave: "premio",
    glifo: "🎁",
    titulo: messages.landing.howStepRewardTitle,
    cuerpo: messages.landing.howStepRewardBody,
  },
];

export function HowItWorks(): React.ReactElement {
  return (
    <section className="bg-surface-sunken">
      <div className="mx-auto flex w-full max-w-(--container-wide) flex-col gap-8 px-4 py-12">
        <h2 className="text-title max-w-(--container-reading) font-extrabold">
          {messages.landing.howTitle}
        </h2>

        {/*
          Una LISTA ORDENADA, y no una rejilla de cuatro cajas: lo que hay que
          entender es la secuencia, y `<ol>` es lo que se lo dice a quien recorre
          la página sin verla. La flecha entre pasos es decorativa — el orden ya
          lo lleva la estructura.
        */}
        <ol className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((paso, indice) => (
            <li key={paso.clave} className="relative flex">
              <div
                {...(paso.delPadre === true ? { "data-surface": "brand" } : {})}
                className={`rounded-card flex flex-1 flex-col gap-3 border p-5 ${
                  paso.delPadre === true
                    ? "border-brand-line bg-brand text-ink"
                    : "border-border bg-surface-raised"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="rounded-card grid size-12 place-items-center bg-surface-sunken"
                >
                  {paso.cifra === true ? (
                    <Coins amount={MONEDAS_DE_EJEMPLO} />
                  ) : (
                    <span className="text-title leading-none">{paso.glifo}</span>
                  )}
                </span>

                <p className="text-body font-bold">{paso.titulo}</p>
                <p className="text-small text-ink-muted">{paso.cuerpo}</p>
              </div>

              {/*
                El conector, decorativo. Entre columnas en ancho y entre filas en
                estrecho, porque el flujo cambia de dirección al apilarse.
              */}
              {indice < PASOS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="text-body text-ink-muted absolute -bottom-4 left-1/2 lg:-right-4 lg:bottom-auto lg:left-auto lg:top-1/2"
                >
                  <span className="lg:hidden">↓</span>
                  <span className="hidden lg:inline">→</span>
                </span>
              )}
            </li>
          ))}
        </ol>

        <p className="text-small text-ink-muted">{messages.landing.howLoop}</p>
      </div>
    </section>
  );
}
