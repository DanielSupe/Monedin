import { messages } from "../../lib/messages.js";

/**
 * El ciclo del producto, en línea recta y sin fin.
 *
 * Es lo mismo que la puerta pública dibuja orbitando —se hace una tarea, se
 * gana una moneda, se gasta en un premio— contado con la forma que cabe en el
 * hueco de una pantalla de acceso. La repetición ES el mensaje: el ciclo no
 * termina, vuelve a empezar.
 *
 * SIN estilos en línea, y a conciencia. `Orbits` es una excepción declarada
 * porque su geometría se calcula —nueve ángulos y tres radios—; aquí solo hay
 * una traslación, así que son clases y un `@keyframes` en `tokens.css`. Cada
 * llamada nueva a `allowInlineStyles()` debilita la regla y esta no hacía falta.
 * Ver la decisión 2 del design.
 *
 * Para las tecnologías de asistencia es UNA imagen con su descripción, igual
 * que las órbitas: doce emojis leídos en voz alta no explican nada.
 */

/** Un ciclo completo. La moneda vuelve siempre en el medio, que es el punto. */
const CICLOS = [
  ["🧹", "🪙", "🎬"],
  ["🛏️", "🪙", "🍦"],
  ["📚", "🪙", "🎮"],
] as const;

export function CycleStrip(): React.ReactElement {
  return (
    <div
      role="img"
      aria-label={messages.auth.accessStripLabel}
      // `overflow-hidden` es lo que hace que una fila infinita no ensanche el
      // documento. Sin esto, la tira duplicada desborda de lado en un móvil.
      className="rounded-card overflow-hidden bg-surface-sunken py-3"
    >
      {/*
        La tira se escribe DOS veces y la animación la desplaza la mitad: al
        terminar, la copia está exactamente donde empezaba la primera, así que
        el salto no se ve.

        El movimiento va bajo `motion-safe:`. Bajar la duración a 1ms —que es lo
        que hace el bloque del sistema— convertiría el deslizamiento en un salto
        instantáneo, peor para quien pidió no ver movimiento. Parada, la cinta
        sigue completa: su estado final es ella misma.
      */}
      <div
        aria-hidden="true"
        className="flex w-max motion-safe:animate-strip"
      >
        <Tira />
        <Tira />
      </div>
    </div>
  );
}

function Tira(): React.ReactElement {
  return (
    <div className="flex shrink-0 items-center">
      {CICLOS.map((ciclo, indice) => (
        <div key={indice} className="text-title flex items-center gap-3 px-3 leading-none">
          {ciclo.map((glifo, posicion) => (
            <span key={posicion} className="flex items-center gap-3">
              <span>{glifo}</span>
              {posicion < ciclo.length - 1 && <span className="text-ink-muted">→</span>}
            </span>
          ))}
          <span className="text-ink-muted">·</span>
        </div>
      ))}
    </div>
  );
}
