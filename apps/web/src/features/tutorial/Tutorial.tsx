import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { Button, Spotlight } from "../../ui/index.js";
import { useUpdateTutorial } from "../auth/use-session.js";
import type { TutorialStep } from "./steps.js";
import { useAnchorRect } from "./use-anchor-rect.js";

/**
 * El recorrido de bienvenida, conducido paso a paso.
 *
 * Lo monta cada pantalla de inicio y no el archivo de ruta, porque cada una
 * conoce sus anclas — y porque un archivo de ruta monta el destino y no lo
 * dibuja.
 *
 * QUIÉN DECIDE SI SE VE: quien lo monta, mirando el actor. Este componente no
 * consulta la sesión; recibe los pasos y avisa cuando termina. Así se prueba
 * montándolo con un guion cualquiera, sin servidor.
 *
 * TERMINAR Y SALTAR SON LO MISMO para el sistema: los dos marcan visto. Un
 * recorrido que solo contara como visto al llegar al final volvería a salirle
 * cada vez a quien lo saltó, que es justo a quien ya dijo que no.
 */
export function Tutorial({ steps }: { steps: TutorialStep[] }): React.ReactElement | null {
  const [indice, setIndice] = useState(0);
  const marcar = useUpdateTutorial();

  const paso = steps[indice];
  const rect = useAnchorRect(paso?.anchor);

  if (paso === undefined) {
    return null;
  }

  const esElUltimo = indice === steps.length - 1;

  /** Terminar y saltar hacen lo mismo: cerrar y no volver a salir. */
  const cerrar = (): void => {
    marcar.mutate({ seen: true });
  };

  return (
    <Spotlight
      open
      // Escape y pulsar fuera cuentan como saltar: son salidas, y una salida que
      // no se recuerda devuelve el recorrido en la siguiente visita.
      onOpenChange={(abierto) => {
        if (!abierto) cerrar();
      }}
      title={paso.title}
      description={paso.body}
      {...(rect === undefined ? {} : { rect })}
      footer={
        <>
          {/*
            Saltar, desde el PRIMER paso. Obligar a un adulto a pasar cinco
            pantallas para llegar a su panel es cómo se aprende a cerrar cosas
            sin leerlas.
          */}
          <Button variant="ghost" onClick={cerrar} disabled={marcar.isPending}>
            {messages.tutorial.skip}
          </Button>

          <div className="flex items-center gap-3">
            {/* La cuenta se compone AQUÍ: ninguna cadena del catálogo lleva
                una cifra dentro. */}
            <span className="text-small text-ink-muted">
              {indice + 1} {messages.tutorial.stepOf} {steps.length}
            </span>

            <Button
              variant="primary"
              pending={esElUltimo && marcar.isPending}
              onClick={() => {
                if (esElUltimo) {
                  cerrar();
                  return;
                }
                setIndice((actual) => actual + 1);
              }}
            >
              {esElUltimo ? messages.tutorial.finish : messages.tutorial.next}
            </Button>
          </div>
        </>
      }
    >
      {/*
        La ilustración es DECORATIVA: lo que explica el paso es su texto, que ya
        se anuncia como descripción del panel. Anunciarla sería decirlo dos
        veces, igual que en la puerta pública.
      */}
      {/*
        ALTURA fija y ancho natural, no un cuadrado.

        Estaba en `size-24`, que fija los dos lados: las ilustraciones no son
        cuadradas —cada una se recortó ajustada a su figura— así que salían
        estiradas. `object-contain` es el cinturón por si alguna llegara con otra
        proporción.

        Y a 40 es donde se lee: a 24 la mascota era un icono, y lo que hace es
        acompañar la explicación.
      */}
      <img src={paso.image} alt="" className="mx-auto h-40 w-auto object-contain" />
    </Spotlight>
  );
}
