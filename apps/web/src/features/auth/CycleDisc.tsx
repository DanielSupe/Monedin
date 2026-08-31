import { messages } from "../../lib/messages.js";

/**
 * El ciclo del producto, en órbitas.
 *
 * Ocupa el sitio y la forma que la maqueta de referencia le daba a una foto.
 * Es la misma idea que la puerta pública —lo que se hace y lo que se gana dando
 * vueltas alrededor de la moneda— con **dos anillos en vez de tres**: aquí es
 * el adorno de un panel, no la ilustración principal de la página.
 *
 * SIN estilos en línea, y eso es lo que decide la forma. `Orbits` es una
 * excepción declarada porque su geometría se calcula: nueve piezas en ángulos
 * arbitrarios sobre tres radios. Aquí cada anillo pone sus piezas en los cuatro
 * puntos cardinales —utilidades normales— y el de fuera se gira 45° entero para
 * que caigan en las diagonales. Posiciones distintas sin un solo valor
 * arbitrario, y una tercera llamada a `allowInlineStyles()` que no hace falta.
 *
 * Lo que impide que las piezas se pongan cabeza abajo: cada anillo gira en un
 * sentido y cada pieza gira al revés a la vez. En Tailwind 4 la posición y el
 * giro estático usan las propiedades `translate` y `rotate`, y la animación usa
 * `transform`, así que se componen en vez de pisarse.
 *
 * `motion-safe:` en todo lo que gira. Bajar la duración a 1ms —que es lo que
 * hace el bloque del sistema— convertiría el giro en un parpadeo. Parado, el
 * dibujo sigue completo y con sus piezas en su sitio: su estado final es él
 * mismo.
 *
 * Para las tecnologías de asistencia es UNA imagen con su descripción, igual
 * que las órbitas: siete emojis leídos en voz alta no explican nada.
 */

/** El anillo de fuera: lo que se hace y lo que se gana, alternando. */
const FUERA = [
  { glifo: "🧹", sitio: "left-1/2 top-0 -translate-x-1/2" },
  { glifo: "🎬", sitio: "right-0 top-1/2 -translate-y-1/2" },
  { glifo: "📚", sitio: "bottom-0 left-1/2 -translate-x-1/2" },
  { glifo: "🍦", sitio: "left-0 top-1/2 -translate-y-1/2" },
] as const;

/** El de dentro, más pequeño y con menos piezas: da profundidad sin recargar. */
const DENTRO = [
  { glifo: "🛏️", sitio: "left-1/2 top-0 -translate-x-1/2" },
  { glifo: "🎮", sitio: "bottom-0 left-1/2 -translate-x-1/2" },
] as const;

export function CycleDisc(): React.ReactElement {
  return (
    <div
      role="img"
      aria-label={messages.auth.accessDiscLabel}
      className="relative mx-auto size-64 shrink-0"
    >
      {/*
        Las trazas de las dos órbitas, del color de la MARCA.

        Antes el disco iba relleno y las trazas en blanco translúcido. Sin
        relleno, el color se mueve al trazo: la órbita se dibuja en vez de
        pintarse, y el panel blanco respira.

        Los radios están elegidos para que NADA se toque, sobre un disco de
        16rem: el anillo de fuera ocupa de 80 a 128 px del centro, el de dentro
        de 48 a 80, y la moneda llega a 32. La primera versión los tenía
        encimados y el dibujo se leía como un amasijo.
      */}
      <span
        aria-hidden="true"
        className="absolute inset-6 rounded-full border-2 border-brand"
      />
      <span
        aria-hidden="true"
        className="absolute inset-16 rounded-full border-2 border-brand"
      />

      <div aria-hidden="true" className="absolute inset-6 rotate-45 motion-safe:animate-disc">
        {FUERA.map((pieza) => (
          <span key={pieza.glifo} className={`absolute ${pieza.sitio}`}>
            <span className="text-title flex size-12 -rotate-45 items-center justify-center rounded-full border-2 border-brand bg-surface-raised shadow-card leading-none motion-safe:animate-disc-reverse">
              {pieza.glifo}
            </span>
          </span>
        ))}
      </div>

      {/* El de dentro gira al revés que el de fuera: da sensación de profundidad. */}
      <div aria-hidden="true" className="absolute inset-16 motion-safe:animate-disc-reverse">
        {DENTRO.map((pieza) => (
          <span key={pieza.glifo} className={`absolute ${pieza.sitio}`}>
            <span className="text-body flex size-8 items-center justify-center rounded-full border-2 border-brand bg-surface-raised shadow-card leading-none motion-safe:animate-disc">
              {pieza.glifo}
            </span>
          </span>
        ))}
      </div>

      {/*
        La moneda, quieta en el centro, y con su ficha.

        Sin el relleno del disco, las fichas quedaban blancas sobre un panel
        blanco: se sostenían solo por la sombra y CORTABAN la traza por donde
        pasaban. Con el aro del mismo color dejan de ser recortes y pasan a ser
        NODOS de la órbita, que es lo que son.
      */}
      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
        <span className="text-title flex size-16 items-center justify-center rounded-full border-2 border-brand bg-surface-raised shadow-raised leading-none">
          🪙
        </span>
      </span>
    </div>
  );
}
