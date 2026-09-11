import { Link } from "@tanstack/react-router";
import { HELP_AGE_QUESTION, HELP_PIN_QUESTION, messages } from "../../lib/messages.js";
import { Accordion, HeroPanel, IconTile, Mascota, buttonClasses } from "../../ui/index.js";
import type { AccordionItem } from "../../ui/index.js";

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
const h = messages.help;

/**
 * Las preguntas, en su orden.
 *
 * Fuera del JSX para poder numerarlas de una vez: nueve números escritos a mano
 * son nueve sitios donde se puede colar un salto al insertar la décima.
 */
const PREGUNTAS: AccordionItem[] = [
  { value: "coins", label: h.coinsQ, content: <p className="m-0">{h.coinsA}</p> },
  { value: "earn", label: h.earnQ, content: <p className="m-0">{h.earnA}</p> },
  { value: "approve", label: h.approveQ, content: <p className="m-0">{h.approveA}</p> },
  { value: "twice", label: h.twiceQ, content: <p className="m-0">{h.twiceA}</p> },
  { value: "reward", label: h.rewardQ, content: <p className="m-0">{h.rewardA}</p> },
  { value: "reject", label: h.rejectQ, content: <p className="m-0">{h.rejectA}</p> },
  { value: "sibling", label: h.siblingQ, content: <p className="m-0">{h.siblingA}</p> },
  { value: "age", label: HELP_AGE_QUESTION, content: <p className="m-0">{h.ageA}</p> },
  { value: "pin", label: HELP_PIN_QUESTION, content: <p className="m-0">{h.pinA}</p> },
];

/**
 * Cada pregunta con su número delante.
 *
 * El número es un ANCLA para volver, no información: quien no ve la pantalla ya
 * oye la pregunta entera, así que va oculto. Lo que aporta es que una lista
 * plegada de nueve renglones se pueda recorrer sabiendo por dónde se iba.
 */
function numeradas(preguntas: AccordionItem[]): AccordionItem[] {
  return preguntas.map((pregunta, indice) => ({
    ...pregunta,
    lead: (
      <IconTile tone="waiting">
        <span className="text-small font-extrabold">{indice + 1}</span>
      </IconTile>
    ),
  }));
}

export function HelpScreen(): React.ReactElement {

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h2 className="text-display font-extrabold text-ink">{h.title}</h2>
        <p className="text-body text-ink-muted">{h.lead}</p>
      </header>

      <Accordion items={numeradas(PREGUNTAS)} />

      {/*
        Cuando ninguna de las preguntas es la tuya.
        Un ENLACE vestido de botón, nunca un `<Link>` envolviendo un `<Button>`:
        eso anida dos elementos interactivos y se anuncia como «enlace que
        contiene un botón». Se cayó dos veces en eso antes de extraer
        `buttonClasses`. Y siendo enlace se puede abrir en otra pestaña.
      */}
      <HeroPanel mascot={<Mascota pose="propone" size="medium" />}>
        <p className="text-lead m-0 font-extrabold text-ink-inverted">{h.moreDoubts}</p>
        {/*
          `contrast` y no `primary`: sobre el degradado, la acción principal del
          sistema desaparecería en su propio color. La variante se nombra por el
          papel, así que esto no dice cuál es.
        */}
        <Link to="/assistant" className={buttonClasses("contrast")}>
          {h.askMonedin}
        </Link>
      </HeroPanel>
    </section>
  );
}
