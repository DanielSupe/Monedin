import { Link } from "@tanstack/react-router";
import { HELP_AGE_QUESTION, HELP_PIN_QUESTION, messages } from "../../lib/messages.js";
import { Accordion, Card, buttonClasses } from "../../ui/index.js";

/**
 * Las preguntas frecuentes.
 *
 * UNA SOLA PANTALLA para los dos roles. El marco ya declara `data-scale`, así
 * que las mismas piezas rinden con cifras grandes y objetivos de toque de 44px
 * para el niño sin duplicar nada.
 *
 * PLEGADAS de entrada, y esa es la decisión: una lista de respuestas abiertas
 * obliga a desplazar para encontrar la pregunta propia, que es justo lo que hay
 * que hacer primero. Lo que se lee de un vistazo son los enunciados.
 *
 * Dos preguntas llevan una cifra dentro y NO están escritas aquí: se componen en
 * el catálogo desde las constantes del contrato. Escribir «PIN de 4 dígitos» a
 * mano es cómo se acaba con la pantalla diciendo una cosa y la validación
 * exigiendo otra.
 */
export function HelpScreen(): React.ReactElement {
  const h = messages.help;

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-title font-bold text-ink">{h.title}</h2>
        <p className="text-body text-ink-muted">{h.lead}</p>
      </header>

      <Accordion
        items={[
          { value: "coins", label: h.coinsQ, content: <p className="m-0">{h.coinsA}</p> },
          { value: "earn", label: h.earnQ, content: <p className="m-0">{h.earnA}</p> },
          { value: "approve", label: h.approveQ, content: <p className="m-0">{h.approveA}</p> },
          { value: "twice", label: h.twiceQ, content: <p className="m-0">{h.twiceA}</p> },
          { value: "reward", label: h.rewardQ, content: <p className="m-0">{h.rewardA}</p> },
          { value: "reject", label: h.rejectQ, content: <p className="m-0">{h.rejectA}</p> },
          { value: "sibling", label: h.siblingQ, content: <p className="m-0">{h.siblingA}</p> },
          { value: "age", label: HELP_AGE_QUESTION, content: <p className="m-0">{h.ageA}</p> },
          { value: "pin", label: HELP_PIN_QUESTION, content: <p className="m-0">{h.pinA}</p> },
        ]}
      />

      {/*
        Cuando ninguna de las preguntas es la tuya.
        Un ENLACE vestido de botón, nunca un `<Link>` envolviendo un `<Button>`:
        eso anida dos elementos interactivos y se anuncia como «enlace que
        contiene un botón». Se cayó dos veces en eso antes de extraer
        `buttonClasses`. Y siendo enlace se puede abrir en otra pestaña.
      */}
      <Card className="flex flex-col items-start gap-3">
        <p className="text-body m-0 font-semibold text-ink">{h.moreDoubts}</p>
        <Link to="/assistant" className={buttonClasses("primary")}>
          {h.askMonedin}
        </Link>
      </Card>
    </section>
  );
}
