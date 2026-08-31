import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { messages } from "../../lib/messages.js";
import { Logo } from "../../ui/index.js";
import { CycleDisc } from "./CycleDisc.js";

/**
 * El lienzo de entrar y crear cuenta.
 *
 * Copia la composición de la maqueta de referencia con nuestros valores: un
 * fondo PARTIDO en dos —el color de la marca y blanco— y encima **dos paneles
 * verticales y estrechos**, el de presentación y el del formulario, escalonados
 * como en la maqueta.
 *
 * En una pantalla estrecha el reparto en dos columnas no significa nada, así
 * que los paneles se apilan: primero la presentación con las órbitas, después
 * el formulario. No se esconde ninguno, porque las órbitas son la mitad de lo
 * que esta pantalla cuenta.
 *
 * Es a sangre —`fullBleed`— como la puerta pública, y por eso dibuja su propio
 * logo: `EntryShell` sirve para las pantallas que se conforman con el fondo de
 * siempre, y esta se pinta entera.
 *
 * Recibe el formulario como HIJO y **no decide cuál enseñar**. Si tuviera un
 * `if` sobre el modo, habríamos movido el problema que este change vino a
 * resolver. Ver la decisión 1 del design de `redesign-access`.
 */
export function AccessLayout({
  lead,
  tagline,
  children,
  footer,
}: {
  /** Qué se viene a hacer. Encabeza el panel del formulario. */
  lead: string;
  /** La frase del panel de presentación. Es lo otro que distingue las dos pantallas. */
  tagline: string;
  children: ReactNode;
  /** El camino al otro formulario. Va en la parte blanca, como en la maqueta. */
  footer: ReactNode;
}): React.ReactElement {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-surface-raised">
      {/*
        El fondo partido. Un bloque a un lado y no un degradado: en la maqueta el
        color ocupa una franja entera y el resto queda en blanco.

        Solo desde `lg`: en un móvil los paneles ocupan el ancho completo, así
        que partir el fondo detrás no se vería y solo sería ruido.
      */}
      <div aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-2/5 bg-brand lg:block" />

      {/*
        Una mancha difusa detrás de los paneles. Es lo único aquí que no cuenta
        nada: da profundidad para que las tarjetas no floten sobre un plano.
      */}
      <div
        aria-hidden="true"
        className="absolute -top-24 right-0 hidden size-96 rounded-full bg-brand/10 blur-3xl lg:block"
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-(--container-wide) flex-col justify-center gap-6 lg:flex-row lg:items-stretch lg:justify-center lg:gap-10 lg:px-8 lg:py-12">
        <PresentationPanel tagline={tagline} />

        {/*
          El panel del formulario. `data-surface="brand"` reasigna la tinta
          secundaria: sobre el ámbar, el gris de la pantalla clara se lava y el
          texto de ayuda deja de leerse. Lo resuelve `tokens.css`, no esta
          pantalla.
        */}
        {/*
          El panel: base BLANCA, y dentro un bloque oscuro que ocupa la mayor
          parte. La superficie de marca es el BLOQUE y no el panel entero, y esa
          distinción es lo que deja el pie en blanco: dentro del selector,
          `--color-surface-raised` es índigo, así que un pie que lo usara se
          volvería oscuro y el enlace se perdería. Pasó.
        */}
        <section className="rounded-panel flex flex-col overflow-hidden bg-surface-raised text-ink shadow-raised max-lg:rounded-none lg:w-96 lg:shrink-0">
          <div
            data-surface="brand"
            /*
              `text-ink` va AQUÍ y no en el panel de fuera, y la diferencia no
              es cosmética: una utilidad resuelve la variable DONDE se aplica, y
              el color ya resuelto se hereda. Puesto fuera, `text-ink` valía la
              tinta oscura y bajaba oscura al bloque, así que el saludo salía
              casi invisible sobre el índigo. Las etiquetas se veían bien porque
              `Field` aplica su propio `text-ink` ya dentro del selector.
            */
            className="flex flex-1 flex-col justify-center gap-6 bg-brand px-6 pt-10 pb-12 text-ink"
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-hero font-extrabold">{messages.auth.accessGreeting}</h2>
              <p className="text-body">{lead}</p>
            </div>

            {children}
          </div>

          {/*
            La lámina blanca, con la esquina redondeada de la maqueta y NO un
            degradado. El degradado se diseñó cuando el panel era ámbar claro y
            se desvanecía hacia el blanco; de índigo profundo a blanco el mismo
            recorrido pasa por grises y ensucia. La maqueta dibuja una lámina, y
            sobre oscuro es además lo que se lee limpio.
          */}
          <footer className="rounded-t-sheet -mt-6 bg-surface-raised px-6 py-6 text-center">
            {footer}
          </footer>
        </section>
      </div>
    </div>
  );
}

/**
 * El panel blanco: la marca, las órbitas y una frase.
 *
 * Es el equivalente del panel izquierdo de la maqueta, donde la foto ocupaba el
 * centro. Aquí ese sitio lo ocupa el ciclo del producto, que es de lo que va
 * Monedín y no una decoración.
 *
 * `lg:mt-10` lo escalona respecto al del formulario, como en la maqueta: dos
 * tarjetas exactamente alineadas se leen como una tabla, no como una portada.
 */
function PresentationPanel({ tagline }: { tagline: string }): React.ReactElement {
  return (
    <section className="rounded-panel flex flex-col justify-between gap-8 bg-surface-raised px-6 pt-6 pb-10 text-ink shadow-raised max-lg:rounded-none max-lg:shadow-none lg:mt-10 lg:mb-0 lg:w-96 lg:shrink-0 lg:px-8 lg:pt-8">
      {/* La marca vuelve a la puerta pública, que es de donde se viene. */}
      <Link to="/welcome" className="self-start no-underline">
        <Logo size="medium" />
      </Link>

      <CycleDisc />

      <p className="text-title font-bold">{tagline}</p>
    </section>
  );
}
