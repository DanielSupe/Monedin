import { messages } from "../../lib/messages.js";

/**
 * El ciclo del producto, en órbitas.
 *
 * Es **la misma órbita de la puerta pública, simplificada**: los mismos tres
 * anillos y los mismos radios —64, 100 y 136 sobre un escenario de 20rem—, el
 * mismo lenguaje de piezas —cuadrados redondeados blancos con sombra y sin
 * borde— y las mismas trazas de 1px que solo se insinúan. Lo que cambia es la
 * cantidad: **dos piezas por anillo en vez de tres**, porque aquí decora un
 * panel y allí lleva la página entera.
 *
 * SIN estilos en línea, y eso es lo único que se hace distinto. `Orbits` los
 * necesita porque calcula `rotate(a) translate(r) rotate(-a)` para nueve
 * ángulos arbitrarios; aquí cada anillo pone sus dos piezas arriba y abajo
 * —utilidades normales— y se gira el anillo ENTERO para repartirlas: 0°, 45° y
 * 90°. Mismo resultado a la vista, y una tercera llamada a
 * `allowInlineStyles()` que no hace falta.
 *
 * Lo que impide que las piezas se pongan cabeza abajo es doble: cada pieza
 * deshace el giro estático de su anillo y además gira al revés que la
 * animación. En Tailwind 4 el giro estático usa la propiedad `rotate` y la
 * animación usa `transform`, así que se componen en vez de pisarse.
 *
 * `motion-safe:` en todo lo que gira. Bajar la duración a 1ms —lo que hace el
 * bloque del sistema— convertiría el giro en un parpadeo. Parado, el dibujo
 * sigue completo y con sus piezas en su sitio.
 *
 * Para las tecnologías de asistencia es UNA imagen con su descripción, igual
 * que las órbitas: seis emojis leídos en voz alta no explican nada.
 */

interface Anillo {
  /** Cuánto se mete respecto al escenario. Fija el radio: 160 menos esto. */
  hueco: string;
  /** Reparte las piezas sin cambiarlas de sitio: gira el anillo entero. */
  giro: string;
  /** Y cada pieza deshace ese mismo giro para quedar derecha. */
  contragiro: string;
  /** Cuanto más fuera, más despacio. Los anillos alternan sentido. */
  vuelta: string;
  contravuelta: string;
  piezas: readonly [string, string];
}

const ANILLOS: readonly Anillo[] = [
  {
    hueco: "inset-6",
    giro: "rotate-0",
    contragiro: "rotate-0",
    vuelta: "motion-safe:animate-disc-slow",
    contravuelta: "motion-safe:animate-disc-slow-reverse",
    piezas: ["🧹", "🎬"],
  },
  {
    hueco: "inset-15",
    giro: "rotate-45",
    contragiro: "-rotate-45",
    vuelta: "motion-safe:animate-disc-reverse",
    contravuelta: "motion-safe:animate-disc",
    piezas: ["📚", "🍦"],
  },
  {
    hueco: "inset-24",
    giro: "rotate-90",
    contragiro: "-rotate-90",
    vuelta: "motion-safe:animate-disc",
    contravuelta: "motion-safe:animate-disc-reverse",
    piezas: ["🛏️", "🎮"],
  },
];

/**
 * Arriba y abajo. El giro del anillo se encarga de repartirlas.
 *
 * `-top-5` y `-bottom-5` y NO `top-0`: la ficha mide 2.5rem, así que hay que
 * sacarla media ficha para que su CENTRO caiga sobre la línea del anillo. Con
 * `top-0` se alinea el borde, y las seis piezas quedaban 20px por dentro de su
 * órbita —medido: 115 donde tocaba 136—. Es el mismo centrado que hace la
 * puerta pública con `-ml-5 -mt-5`.
 */
const SITIOS = ["left-1/2 -top-5 -translate-x-1/2", "-bottom-5 left-1/2 -translate-x-1/2"] as const;

export function CycleDisc(): React.ReactElement {
  return (
    <div
      role="img"
      aria-label={messages.auth.accessDiscLabel}
      /*
        El mismo escenario que la puerta pública, y por el mismo motivo: los
        radios son proporciones de este cuadrado, así que tiene que medir
        siempre lo mismo. `max-w-full` para que en un panel estrecho encoja en
        vez de desbordar.
      */
      className="relative mx-auto size-(--container-orbit) max-w-full shrink-0"
    >
      {ANILLOS.map((anillo) => (
        <div
          key={anillo.hueco}
          aria-hidden="true"
          className={`absolute ${anillo.hueco} ${anillo.giro} ${anillo.vuelta} rounded-full border border-brand-soft`}
        >
          {anillo.piezas.map((glifo, indice) => (
            <span key={glifo} className={`absolute ${SITIOS[indice]}`}>
              <span
                className={`rounded-card text-title grid size-10 place-items-center bg-surface-raised shadow-card ${anillo.contragiro} ${anillo.contravuelta}`}
              >
                {glifo}
              </span>
            </span>
          ))}
        </div>
      ))}

      {/*
        El centro, con la misma forma de tarjeta que el de la puerta pública.
        Allí lleva un saldo de ejemplo; aquí solo la moneda: en una pantalla de
        acceso, una cifra inventada es ruido con pinta de dato.
      */}
      <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
        <span className="rounded-card text-hero grid size-20 place-items-center bg-surface-raised shadow-raised">
          🪙
        </span>
      </span>
    </div>
  );
}
