import { messages } from "../../lib/messages.js";
import { Logo } from "../../ui/index.js";

interface Anillo {
  hueco: string;

  giro: string;

  contragiro: string;

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

const SITIOS = ["left-1/2 -top-5 -translate-x-1/2", "-bottom-5 left-1/2 -translate-x-1/2"] as const;

export function CycleDisc(): React.ReactElement {
  return (
    <div
      role="img"
      aria-label={messages.auth.accessDiscLabel}

      className="relative mx-auto size-(--container-orbit) max-w-full shrink-0"
    >
      {ANILLOS.map((anillo) => (
        <div
          key={anillo.hueco}
          aria-hidden="true"
          className={`absolute ${anillo.hueco} ${anillo.giro} ${anillo.vuelta} rounded-pill border border-brand-soft`}
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

      <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
        <span className="rounded-card grid size-20 place-items-center bg-surface-raised shadow-raised">
          <Logo size="large" markOnly />
        </span>
      </span>
    </div>
  );
}
