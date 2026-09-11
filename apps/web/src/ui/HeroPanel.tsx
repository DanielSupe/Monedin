import type { ReactNode } from "react";
import { cx } from "./cx.js";

/**
 * Los dos papeles que puede tener un realce, y son los dos tonos del sistema.
 *
 * `action` es donde se HACE algo: el saludo del inicio, lo que espera al padre,
 * una tarea por delante. `saving` es lo CONSEGUIDO o lo que se persigue: el
 * próximo premio, un canje resuelto, el progreso hacia una meta.
 *
 * Es un conjunto CERRADO, y ahí está media pieza. Si el punto de uso pudiera
 * pasar un color, el degradado podría mezclar los dos tonos del sistema — y un
 * degradado que va del coral al violeta deja de decir cuál de los dos manda.
 * Así esa regla no se puede incumplir en vez de tener que recordarla.
 */
export type HeroTone = "action" | "saving";

const TONES: Record<HeroTone, string> = {
  action: "from-primary-hover via-primary to-primary-hover",
  saving: "from-brand-line via-brand to-brand-deep",
};

export interface HeroPanelProps {
  tone?: HeroTone;
  /** La mascota, si acompaña. Va a la izquierda y no se anuncia. */
  mascot?: ReactNode;
  /** Lo que se enseña a la derecha del contenido: un anillo, una cifra, nada. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * La superficie de realce: un degradado, dos círculos detrás y sitio para la
 * mascota.
 *
 * Sale en trece de las treinta y dos pantallas del rediseño, y por eso existe.
 * Una receta copiada trece veces son trece decisiones que nadie ha comparado, y
 * el día que haya que cambiar el degradado hay que encontrarlas todas. Ya pasó
 * en este proyecto con las tres pantallas del niño que acabaron con la misma
 * lista idéntica sin que nadie lo decidiera: cada una se vistió por separado
 * resolviendo bien SU contenido, y lo que ninguna pudo decidir sola fue el
 * contraste con las otras.
 *
 * Los círculos son DECORACIÓN y no información: van detrás del contenido, no se
 * anuncian, y su única misión es que el degradado no se lea como un rectángulo
 * plano. Se dibujan con las utilidades del sistema y no con una medida calculada,
 * así que esta pieza no necesita la excepción de estilos en línea.
 */
export function HeroPanel({
  tone = "action",
  mascot,
  aside,
  children,
  className,
}: HeroPanelProps): React.ReactElement {
  return (
    <section
      className={cx(
        "rounded-panel relative flex items-center gap-4 overflow-hidden bg-linear-120 p-5 shadow-raised",
        TONES[tone],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="rounded-pill absolute -top-16 right-1/3 size-52 bg-surface-raised/10"
      />
      <span
        aria-hidden="true"
        className="rounded-pill absolute -bottom-20 right-1/4 size-56 bg-surface-raised/8"
      />

      {mascot !== undefined && <span className="relative shrink-0">{mascot}</span>}

      {/*
        `min-w-0`: sin eso, un texto largo fija el ancho mínimo de su columna y se
        come el sitio del anillo. Es el `min-width: auto` del flex, el mismo
        defecto que ya apareció en los marcos y en la puerta pública.
      */}
      <div className="relative flex min-w-0 flex-1 flex-col gap-1">{children}</div>

      {aside !== undefined && <span className="relative shrink-0">{aside}</span>}
    </section>
  );
}
