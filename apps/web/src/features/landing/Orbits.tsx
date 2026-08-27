import { messages } from "../../lib/messages.js";
import { Coins } from "../../ui/index.js";
import { useCountUp } from "./use-count-up.js";
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

/** El saldo del centro. Es un ejemplo, no el dato de nadie. */
const SALDO_DE_EJEMPLO = 340;

export function Orbits(): React.ReactElement {
  const sinMovimiento = usePrefersReducedMotion();
  const saldo = useCountUp(SALDO_DE_EJEMPLO, { duration: 1800, delay: 400 });

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
      */
      className="relative grid size-(--container-orbit) max-w-full place-items-center lg:scale-110"
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
              className="rounded-card text-title absolute left-1/2 top-1/2 -ml-5 -mt-5 grid size-10 place-items-center bg-surface-raised shadow-card"
            >
              {pieza.glifo}
            </span>
          ))}
        </div>
      ))}

      <div className="rounded-card z-10 flex flex-col items-center gap-1 bg-surface-raised px-5 py-4 shadow-raised">
        <Coins amount={saldo} size="hero" />
        <span className="text-small text-ink-muted">{messages.landing.balanceLabel}</span>
      </div>
    </div>
  );
}
