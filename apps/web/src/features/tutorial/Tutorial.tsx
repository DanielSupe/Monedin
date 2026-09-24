import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { Button, Mascota, Spotlight } from "../../ui/index.js";
import { useUpdateTutorial } from "../auth/use-session.js";
import type { TutorialStep } from "./steps.js";
import { useAnchorRect } from "./use-anchor-rect.js";

export function Tutorial({ steps }: { steps: TutorialStep[] }): React.ReactElement | null {
  const [indice, setIndice] = useState(0);
  const marcar = useUpdateTutorial();

  const paso = steps[indice];
  const rect = useAnchorRect(paso?.anchor);

  if (paso === undefined) {
    return null;
  }

  const esElUltimo = indice === steps.length - 1;

  const cerrar = (): void => {
    marcar.mutate({ seen: true });
  };

  return (
    <Spotlight
      open

      onOpenChange={(abierto) => {
        if (!abierto) cerrar();
      }}
      title={paso.title}
      description={paso.body}
      {...(rect === undefined ? {} : { rect })}
      footer={
        <>

          <Button variant="ghost" onClick={cerrar} disabled={marcar.isPending}>
            {messages.tutorial.skip}
          </Button>

          <div className="flex items-center gap-3">

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

      <Mascota pose={paso.pose} size="large" className="mx-auto" />
    </Spotlight>
  );
}
