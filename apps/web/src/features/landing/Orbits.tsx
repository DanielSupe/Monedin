import { messages } from "../../lib/messages.js";
import { Coins } from "../../ui/index.js";
import { useCoinCycle } from "./use-coin-cycle.js";
import { usePrefersReducedMotion } from "./use-reduced-motion.js";

interface Orbita {
  radio: number;

  segundos: number;

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

  const saldo = useCoinCycle();

  return (
    <div
      role="img"
      aria-label={messages.landing.orbitLabel}

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

            animationPlayState: sinMovimiento ? "paused" : "running",
          }}

          className={`absolute inset-0 m-auto rounded-pill border border-primary-soft ${
            orbita.invertida ? "animate-orbit-reverse" : "animate-orbit"
          }`}
        >
          {orbita.piezas.map((pieza) => (
            <span
              key={pieza.glifo}
              style={{
                transform: `rotate(${pieza.angulo}deg) translate(${orbita.radio}px) rotate(-${pieza.angulo}deg)`,
              }}

            className="rounded-control text-title absolute left-1/2 top-1/2 -ml-4 -mt-4 grid size-8 place-items-center bg-surface-raised shadow-card"
            >
              {pieza.glifo}
            </span>
          ))}
        </div>
      ))}

      <div className="rounded-card z-10 flex flex-col items-center bg-surface-raised px-4 py-2 shadow-raised">
        <Coins amount={saldo} size="hero" />
        <span className="text-small text-ink-muted">{messages.landing.balanceLabel}</span>
      </div>
    </div>
  );
}
