import { Link } from "@tanstack/react-router";
import { HELP_AGE_QUESTION, HELP_PIN_QUESTION, messages } from "../../lib/messages.js";
import { useSession } from "../auth/use-session.js";
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

/** Una entrada del desplegable, para no repetir el `<p>` once veces. */
function pregunta(value: string, label: string, answer: string): AccordionItem {
  return { value, label, content: <p className="m-0">{answer}</p> };
}

/**
 * LAS DEL PADRE. Son las que había, en su registro —tercera persona, «el niño lo
 * pide y un adulto lo aprueba»—, que es el de un manual para quien administra.
 *
 * Con dos nuevas sobre dinero ya movido, que son las que más se preguntan y no
 * estaban: subir el precio de un premio ya pedido, y qué diferencia hay entre
 * retirar un premio y dejar de ofrecérselo a un hijo.
 */
const DEL_PADRE: AccordionItem[] = [
  pregunta("coins", h.coinsQ, h.coinsA),
  pregunta("earn", h.earnQ, h.earnA),
  pregunta("approve", h.approveQ, h.approveA),
  pregunta("twice", h.twiceQ, h.twiceA),
  pregunta("reward", h.rewardQ, h.rewardA),
  pregunta("frozen", h.frozenQ, h.frozenA),
  pregunta("retire", h.retireQ, h.retireA),
  pregunta("reject", h.rejectQ, h.rejectA),
  pregunta("sibling", h.siblingQ, h.siblingA),
  pregunta("age", HELP_AGE_QUESTION, h.ageA),
  pregunta("pin", HELP_PIN_QUESTION, h.pinA),
];

/**
 * LAS DEL NIÑO: seis, en su voz y sobre lo que él hace.
 *
 * No son las del padre resumidas. Son otras preguntas: «marqué una tarea y no me
 * pagaron» es suya y solo suya, y «subí el precio de un premio» no puede serlo.
 */
const DEL_NINO: AccordionItem[] = [
  pregunta("coins", h.childCoinsQ, h.childCoinsA),
  pregunta("earn", h.childEarnQ, h.childEarnA),
  pregunta("wait", h.childWaitQ, h.childWaitA),
  pregunta("reject", h.childRejectQ, h.childRejectA),
  pregunta("sibling", h.childSiblingQ, h.childSiblingA),
  pregunta("pin", h.childPinQ, h.childPinA),
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
  /*
   * LA PANTALLA ES UNA Y LAS PREGUNTAS SON DOS, que es exactamente donde está la
   * frontera. Lo que el marco reasigna —la escala, los toques— sirve igual a los
   * dos roles; lo que cada uno pregunta, no.
   */
  const esNino = useSession().session?.actor?.familyRole === "CHILD";

  return (
    <section className="flex flex-col gap-5">
      {/* Antetítulo y título, como el resto de las pantallas del producto: la
          línea de arriba dice qué es la lista y el título cómo se llama. */}
      <header className="flex flex-col gap-1">
        <span className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
          {h.lead}
        </span>
        <h2 className="text-display font-extrabold text-ink">{h.title}</h2>
      </header>

      <Accordion items={numeradas(esNino ? DEL_NINO : DEL_PADRE)} />

      {/*
        Cuando ninguna de las preguntas es la tuya.
        Un ENLACE vestido de botón, nunca un `<Link>` envolviendo un `<Button>`:
        eso anida dos elementos interactivos y se anuncia como «enlace que
        contiene un botón». Se cayó dos veces en eso antes de extraer
        `buttonClasses`. Y siendo enlace se puede abrir en otra pestaña.
      */}
      <HeroPanel mascot={<Mascota pose="propone" size="medium" />}>
        <p className="text-lead m-0 font-extrabold text-ink-inverted">{h.moreDoubts}</p>
        {/* Y QUIÉN va a contestar, que es lo que convence de pulsar: Monedín
            conoce tus tareas, tus premios y tus monedas. El pie lo decía con el
            nombre del destino y nada más. */}
        <p className="text-body m-0 text-ink-inverted opacity-90">{h.moreDoubtsLead}</p>
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
