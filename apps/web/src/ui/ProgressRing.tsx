import { messages } from "../lib/messages.js";
import { cx } from "./cx.js";

export interface ProgressRingProps {
  /** Cuántas van. Se recibe: la pieza no sabe qué es una tarea. */
  done: number;
  total: number;
  className?: string;
}

/*
 * La geometría del aro, en un sitio y no en cuatro atributos.
 *
 * El radio decide la circunferencia, y la circunferencia decide el trazo que hay
 * que dibujar. Escribirlos sueltos haría que cambiar el tamaño exigiera recalcular
 * a mano un número que nadie recuerda de dónde salió.
 */
const RADIO = 46;
const VUELTA = 2 * Math.PI * RADIO;

/**
 * Cuánto llevas, en un aro.
 *
 * RECIBE las dos cifras y no calcula ninguna. Si las dedujera tendría que saber
 * qué es una tarea y en qué estados está, y una pieza del sistema no conoce el
 * dominio — es la misma frontera que impide a `Pagination` construir sus propios
 * enlaces.
 *
 * Y lo que NO cuenta es «lo de hoy». Una tarea no tiene concepto de jornada: solo
 * una fecha límite opcional que, por decisión del producto, ni caduca ni avisa.
 * Quien alimente esta pieza cuenta sobre el total de sus tareas, y decir «hoy»
 * sería enseñar como dato algo que el modelo no sabe.
 *
 * El valor se anuncia con `role="meter"` y sus tres atributos, así que quien no
 * lo ve oye «dos de cinco» en vez de una figura decorativa. La cifra del centro
 * queda oculta para no decirlo dos veces.
 */
export function ProgressRing({ done, total, className }: ProgressRingProps): React.ReactElement {
  const seguro = Math.max(total, 1);
  const parte = Math.min(Math.max(done, 0), seguro) / seguro;

  return (
    <div
      role="meter"
      aria-valuenow={done}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`${String(done)} ${messages.ui.progressOf} ${String(total)}`}
      className={cx("relative flex items-center justify-center", className)}
    >
      <svg viewBox="0 0 118 118" aria-hidden="true" focusable="false" className="size-full">
        <circle
          cx="59"
          cy="59"
          r={RADIO}
          className="fill-none stroke-surface-raised/30"
          strokeWidth="13"
        />
        {/*
          Girado un cuarto de vuelta para que empiece arriba y no a la derecha:
          un aro que arranca a las tres en punto se lee como si ya llevara
          avanzado un cuarto.
        */}
        <circle
          cx="59"
          cy="59"
          r={RADIO}
          className="fill-none stroke-surface-raised transition-all duration-slow"
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${String(VUELTA * parte)} ${String(VUELTA)}`}
          transform="rotate(-90 59 59)"
        />
      </svg>

      <span
        aria-hidden="true"
        className="absolute flex flex-col items-center text-ink-inverted"
      >
        <span className="text-display font-extrabold leading-none">
          {done}/{total}
        </span>
        <span className="text-micro font-bold">{messages.ui.progressDone}</span>
      </span>
    </div>
  );
}
