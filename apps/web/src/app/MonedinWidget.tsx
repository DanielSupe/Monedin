import type { FamilyRole } from "@monedin/contracts";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { messages } from "../lib/messages.js";
import { useReducedMotion } from "./use-reduced-motion.js";
import { LINES, WIDGET_ROTATION_MS, areaOf, offersAssistant } from "./widget-lines.js";

/**
 * Monedín ofreciéndose desde una esquina.
 *
 * VIVE EN `app/` Y NO EN `ui/`, y no es una preferencia: consulta la dirección
 * actual y navega. El test del catálogo vivo prohíbe que `ui-catalog.tsx` monte
 * `RouterProvider`, así que una pieza de `ui/` con un enlace dentro rompería
 * `ui.html`. `app/` es literalmente la capa que «sabe de rol y de destinos pero
 * no de negocio».
 *
 * De regalo: al no exportarse de `ui/index.ts` no necesita —ni puede tener—
 * entrada en el catálogo vivo, así que el test que exige una no se toca.
 *
 * NO ES UN DIÁLOGO. Ni Radix, ni portal, ni `role="dialog"`: es un enlace fijo.
 * `tests/app/tutorial.test.tsx` afirma que no hay ningún diálogo cuando ya se vio
 * el recorrido, y esto no puede contradecirlo.
 *
 * NO SE PUEDE CERRAR, a propósito. Es un acceso permanente como el avatar de la
 * cabecera: un aspa deja a quien la pulsa sin forma de volver a encenderlo, y el
 * problema que resolvería —que canse— se arregla cambiando cada cuánto habla o
 * qué dice.
 */
export function MonedinWidget({ role }: { role: FamilyRole }): React.ReactElement | null {
  const area = useRouterState({ select: (estado) => areaOf(estado.location.pathname) });
  const sinMovimiento = useReducedMotion();
  const [indice, setIndice] = useState(0);

  const linea = LINES[role][area];

  /*
   * Al cambiar de ÁREA se vuelve al principio, y el temporizador se reinicia.
   *
   * Sin esto, quien pasa de un área de tres frases a una de dos se queda en el
   * índice 2 de una lista que tiene 2 elementos, y no ve nada. Es un defecto que
   * solo aparece navegando, así que no lo cazaría un test de una sola pantalla.
   */
  useEffect(() => {
    setIndice(0);
  }, [area, role]);

  useEffect(() => {
    /*
     * CON MOVIMIENTO REDUCIDO NO SE TURNA. Un texto que cambia solo es
     * movimiento, y del que peor sienta.
     *
     * Y hay que PARAR EL TEMPORIZADOR, no acortar la transición: el bloque de
     * `tokens.css` deja las duraciones en un instante, lo que convertiría el
     * cambio en un salto — peor para quien pidió no ver movimiento, no mejor.
     * Poner solo `motion-safe:` en la clase dejaría el texto saltando sin aviso.
     */
    if (sinMovimiento || linea.length < 2) {
      return;
    }

    const temporizador = setInterval(() => {
      // Transición sobre el valor ACTUAL, nunca leyendo `indice` del cierre.
      // Es la lección del teclado de PIN: quien conoce el valor de ahora es el
      // pintado siguiente, no quien pidió el cambio.
      setIndice((actual) => (actual + 1) % linea.length);
    }, WIDGET_ROTATION_MS);

    return () => clearInterval(temporizador);
  }, [sinMovimiento, linea.length, area, role]);

  // En la ayuda ya hay un enlace al chat con este mismo nombre.
  if (!offersAssistant(area)) {
    return null;
  }

  const actual = linea[indice] ?? linea[0];
  if (actual === undefined) {
    return null;
  }

  return (
    /*
      `data-widget` identifica al acceso FLOTANTE, y hace falta.

      Su nombre accesible es el mismo que el del enlace del pie de la ayuda, y
      eso es correcto: son el mismo destino y la misma acción, así que llamarlos
      distinto para que un test los distinga sería mentirle a quien los oye. Lo
      que se necesita es separarlos por ESTRUCTURA, que es lo que son: uno flota
      sobre la página y el otro vive dentro del contenido.

      Es la misma clase de gancho que `data-scale` y `data-tutorial`.
    */
    <div
      data-widget="monedin"
      className="z-widget pointer-events-none fixed bottom-0 right-0 flex justify-end p-4"
    >
      {/*
        EL NOMBRE ACCESIBLE ES FIJO y no el bocadillo. Si el bocadillo fuera el
        nombre, el destino cambiaría de nombre cada ocho segundos: hostil para
        quien no ve la pantalla, y una bomba para cualquier `getByRole` futuro.
        Por eso la ilustración y la frase van ocultas a los lectores.
      */}
      <Link
        to="/assistant"
        aria-label={messages.widget.openChat}
        className="rounded-panel pointer-events-auto flex max-w-tile items-center gap-2 border border-border bg-surface-raised p-2 no-underline shadow-raised transition-colors duration-normal hover:border-primary"
      >
        <p
          aria-hidden="true"
          key={actual.text}
          className="text-small m-0 text-ink motion-safe:animate-fade-in"
        >
          {actual.text}
        </p>
        <img src={actual.image} alt="" aria-hidden="true" className="h-16 w-auto shrink-0" />
      </Link>
    </div>
  );
}
