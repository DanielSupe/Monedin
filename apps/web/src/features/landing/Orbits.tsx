import { messages } from "../../lib/messages.js";
import { Coins } from "../../ui/index.js";
import { useCoinCycle } from "./use-coin-cycle.js";
import { usePrefersReducedMotion } from "./use-reduced-motion.js";

/**
 * El ciclo del producto, dibujado como órbitas.
 *
 * La maqueta de referencia orbitaba retratos porque su producto ERA gente. El
 * nuestro es un ciclo —se hace una tarea, se gana una moneda, se gasta en un
 * premio, se vuelve a empezar— y una órbita es literalmente la forma de dibujar
 * algo que da vueltas. La metáfora encaja por casualidad y sería una pena
 * desperdiciarla decorando.
 *
 * ESTILO EN LÍNEA, y es la SEGUNDA excepción del proyecto tras `ProgressBar`.
 * Cada llamada nueva a `allowInlineStyles()` debilita la regla, así que conviene
 * justificarla: el radio de cada órbita y el ángulo de cada pieza son geometría
 * que se calcula —`rotate(a) translate(r) rotate(-a)` para nueve piezas—, y no
 * hay token que exprese eso. La alternativa era meter doce utilidades de una
 * sola pantalla en el archivo de tokens, que es peor. Toda la geometría está
 * concentrada AQUÍ para que la excepción cubra lo mínimo.
 *
 * Para las tecnologías de asistencia el conjunto es UNA imagen con su
 * descripción: doce emojis leídos en voz alta no explican nada.
 */

interface Orbita {
  /** Radio en píxeles. Define a la vez el tamaño del anillo y dónde caen las piezas. */
  radio: number;
  /** Segundos por vuelta. Cuanto más fuera, más lento: así se lee como un sistema. */
  segundos: number;
  /** Los de dentro y los de fuera giran al revés; da sensación de profundidad. */
  invertida: boolean;
  piezas: Array<{ glifo: string; angulo: number }>;
}

const ORBITAS: Orbita[] = [
  {
    radio: 64,
    segundos: 38,
    invertida: false,
    piezas: [
      { glifo: "🧹", angulo: 0 },
      { glifo: "🛏️", angulo: 120 },
      { glifo: "📚", angulo: 240 },
    ],
  },
  {
    radio: 100,
    segundos: 52,
    invertida: true,
    piezas: [
      { glifo: "🎬", angulo: 55 },
      { glifo: "🍦", angulo: 175 },
      { glifo: "🎮", angulo: 295 },
    ],
  },
  {
    radio: 136,
    segundos: 70,
    invertida: false,
    piezas: [
      { glifo: "🦊", angulo: 30 },
      { glifo: "🐨", angulo: 150 },
      { glifo: "🐙", angulo: 270 },
    ],
  },
];

export function Orbits(): React.ReactElement {
  const sinMovimiento = usePrefersReducedMotion();
  // Sube por pasos y vuelve a empezar: el ciclo del producto contado con la
  // única cifra de la página. Es un ejemplo, no el dato de nadie.
  const saldo = useCoinCycle();

  return (
    <div
      role="img"
      aria-label={messages.landing.orbitLabel}
      /*
        Tamaño FIJO y no `w-full`: la geometría de dentro está en píxeles, así
        que el escenario tiene que medir siempre lo mismo. Con `w-full` lo
        decidía el flex de fuera, y cuando el titular acaparaba el espacio los
        anillos no cabían y dejaban de centrarse. Se agranda con `scale` donde
        sobra sitio, que no toca la disposición.

        El ESCENARIO crece en ancho desde `redesign-public-entry` —de
        `--container-orbit` a `--container-orbit-hero`— y los RADIOS de los
        anillos no se tocan. Es lo que permite que sean protagonistas sin
        ampliar la excepción de estilo en línea, que cubre exactamente nueve
        transformaciones y ninguna más.
      */
      className="relative grid size-(--container-orbit) max-w-full place-items-center lg:size-(--container-orbit-hero) lg:scale-110"
    >
      {ORBITAS.map((orbita) => (
        <div
          key={orbita.radio}
          aria-hidden="true"
          style={{
            inlineSize: `${orbita.radio * 2}px`,
            blockSize: `${orbita.radio * 2}px`,
            animationDuration: `${orbita.segundos}s`,
            /*
              Con movimiento reducido se PARA, no se acelera a 1ms. El bloque de
              `tokens.css` haría lo segundo, y eso congela el giro donde le
              pille; `paused` lo deja en su posición inicial, que es estable.
            */
            animationPlayState: sinMovimiento ? "paused" : "running",
          }}
          /*
            `inset-0 m-auto` y no `place-items-center`: el centrado del grid NO
            afecta a un hijo absoluto, así que cada anillo caía en el origen del
            contenedor y los tres centros quedaban en sitios distintos. Dejaban
            de ser concéntricos y las piezas se esparcían por la pantalla.
            `m-auto` con tamaño explícito centra sin tocar `transform`, que aquí
            lo ocupa la animación de giro.
          */
          className={`absolute inset-0 m-auto rounded-full border border-primary-soft ${
            orbita.invertida ? "animate-orbit-reverse" : "animate-orbit"
          }`}
        >
          {orbita.piezas.map((pieza) => (
            <span
              key={pieza.glifo}
              style={{
                transform: `rotate(${pieza.angulo}deg) translate(${orbita.radio}px) rotate(-${pieza.angulo}deg)`,
              }}
              /*
              La placa se AJUSTA al glifo en vez de envolverlo: era `size-10`
              para un glifo de `text-title`, así que se veía más placa que icono.
              A `size-8` el icono manda, que es lo que hay que ver.

              El desplazamiento es la MITAD del lado —`-ml-4 -mt-4` para
              `size-8`— y por eso la talla no se elige libremente: centrar con
              `translate` no se puede, porque `transform` lo ocupa la geometría
              de la órbita.
            */
            className="rounded-control text-title absolute left-1/2 top-1/2 -ml-4 -mt-4 grid size-8 place-items-center bg-surface-raised shadow-card"
            >
              {pieza.glifo}
            </span>
          ))}
        </div>
      ))}

      {/*
        El centro se ciñe: ocupaba tanto que se comía el anillo interior y los
        iconos de dentro parecían pegados a él. La cifra sigue en `hero` —es lo
        que la página existe para enseñar— y lo que se recorta es el aire.
      */}
      <div className="rounded-card z-10 flex flex-col items-center bg-surface-raised px-4 py-2 shadow-raised">
        <Coins amount={saldo} size="hero" />
        <span className="text-small text-ink-muted">{messages.landing.balanceLabel}</span>
      </div>
    </div>
  );
}
