import { Link } from "@tanstack/react-router";
import { HELP_AGE_QUESTION, HELP_PIN_QUESTION, messages } from "../../lib/messages.js";
import { useSession } from "../auth/use-session.js";
import { Accordion, HeroPanel, IconTile, Mascota, buttonClasses } from "../../ui/index.js";
import type { AccordionItem } from "../../ui/index.js";

const h = messages.help;

function pregunta(value: string, label: string, answer: string): AccordionItem {
  return { value, label, content: <p className="m-0">{answer}</p> };
}

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

const DEL_NINO: AccordionItem[] = [
  pregunta("coins", h.childCoinsQ, h.childCoinsA),
  pregunta("earn", h.childEarnQ, h.childEarnA),
  pregunta("wait", h.childWaitQ, h.childWaitA),
  pregunta("reject", h.childRejectQ, h.childRejectA),
  pregunta("sibling", h.childSiblingQ, h.childSiblingA),
  pregunta("pin", h.childPinQ, h.childPinA),
];

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
  const esNino = useSession().session?.actor?.familyRole === "CHILD";

  return (
    <section className="flex flex-col gap-5">

      <header className="flex flex-col gap-1">
        <span className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
          {h.lead}
        </span>
        <h2 className="text-display font-extrabold text-ink">{h.title}</h2>
      </header>

      <Accordion items={numeradas(esNino ? DEL_NINO : DEL_PADRE)} />

      <HeroPanel mascot={<Mascota pose="propone" size="medium" />}>
        <p className="text-lead m-0 font-extrabold text-ink-inverted">{h.moreDoubts}</p>

        <p className="text-body m-0 text-ink-inverted opacity-90">{h.moreDoubtsLead}</p>

        <Link to="/assistant" className={buttonClasses("contrast")}>
          {h.askMonedin}
        </Link>
      </HeroPanel>
    </section>
  );
}
