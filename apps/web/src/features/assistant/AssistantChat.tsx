import { ASSISTANT_MAX_HISTORY_TURNS, ASSISTANT_QUESTION_MAX_LENGTH } from "@monedin/contracts";
import type { AssistantTurn } from "@monedin/contracts";
import { useEffect, useRef, useState } from "react";
import { useIsWide } from "../../app/use-wide.js";
import { alertToneFor } from "../../lib/alert-tone.js";
import { messages } from "../../lib/messages.js";
import { Alert, Button, Card, HeroPanel, Input, Mascota, Skeleton } from "../../ui/index.js";
import { cx } from "../../ui/cx.js";
import { contar } from "../../lib/plural.js";
import { useSession } from "../auth/use-session.js";
import { usePendingCounts } from "../parents/use-parent-console.js";
import { useOwnTasks } from "../tasks/use-tasks.js";
import { describeAssistantError, useAskAssistant } from "./use-assistant.js";

interface Dicho extends AssistantTurn {
  key: string;
}

export function AssistantChat(): React.ReactElement {
  const [turnos, setTurnos] = useState<Dicho[]>([]);

  const [borrador, setBorrador] = useState("");
  const preguntar = useAskAssistant();
  const ancho = useIsWide();

  const error = preguntar.error === null ? null : describeAssistantError(preguntar.error);
  const vacio = turnos.length === 0;

  const hilo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const caja = hilo.current;
    if (caja !== null) {
      caja.scrollTop = caja.scrollHeight;
    }
  }, [turnos.length, preguntar.isPending]);

  function enviar(pregunta: string): void {
    const limpia = pregunta.trim();
    if (limpia === "" || preguntar.isPending) {
      return;
    }

    setTurnos((actual) => [
      ...actual,
      { key: `${String(actual.length)}-user`, role: "user", text: limpia },
    ]);
    setBorrador("");

    preguntar.mutate(
      {
        question: limpia,

        history: turnos
          .slice(-ASSISTANT_MAX_HISTORY_TURNS)
          .map(({ role, text }) => ({ role, text })),
      },
      { onSuccess: ({ answer }) => { anotarRespuesta(answer); } },
    );
  }

  function anotarRespuesta(answer: string): void {
    setTurnos((actual) => [
      ...actual,
      { key: `${String(actual.length)}-monedin`, role: "assistant", text: answer },
    ]);
  }

  const ultima = turnos.at(-1);
  const puedeReintentar = error !== null && ultima?.role === "user";
  const esPadre = useSession().session?.actor?.familyRole === "PARENT";

  function enviarDeNuevo(pregunta: string): void {
    preguntar.mutate(
      {
        question: pregunta,
        history: turnos
          .slice(0, -1)
          .slice(-ASSISTANT_MAX_HISTORY_TURNS)
          .map(({ role, text }) => ({ role, text })),
      },
      { onSuccess: ({ answer }) => { anotarRespuesta(answer); } },
    );
  }

  const sugerencias = <Sugerencias onElegir={enviar} disabled={preguntar.isPending} />;

  return (
    <section className="flex h-full min-h-0 flex-col gap-4">

      <HeroPanel className="shrink-0" mascot={<Mascota pose="celebra" size="medium" />}>
        <h2 className="text-title m-0 font-extrabold text-ink-inverted">
          {messages.assistant.title}
        </h2>
        <p className="text-body m-0 text-ink-inverted opacity-90">
          {esPadre ? messages.assistant.leadParent : messages.assistant.leadChild}
        </p>
      </HeroPanel>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex min-w-0 min-h-0 flex-1 flex-col gap-3">

          <div ref={hilo} className="min-h-0 flex-1 overflow-y-auto">
            {vacio ? (
              <SaludoDeMonedin />
            ) : (
              <Conversacion turnos={turnos} esperando={preguntar.isPending} />
            )}
          </div>

          {error !== null && (
            <Alert tone={alertToneFor(preguntar.error)}>
              {error}
              {puedeReintentar && (
                <div className="mt-3">
                  <Button
                    variant="secondary"
                    onClick={() => { enviarDeNuevo(ultima.text); }}
                    disabled={preguntar.isPending}
                  >
                    {messages.assistant.retry}
                  </Button>
                </div>
              )}
            </Alert>
          )}

          <form
            className="flex shrink-0 items-center gap-2"
            onSubmit={(evento) => {
              evento.preventDefault();
              enviar(borrador);
            }}
          >
            <Input
              shape="pill"
              aria-label={messages.assistant.inputLabel}
              value={borrador}
              onChange={(evento) => { setBorrador(evento.target.value); }}
              placeholder={messages.assistant.placeholder}

              maxLength={ASSISTANT_QUESTION_MAX_LENGTH}
              autoComplete="off"
              className="min-w-0 flex-1"
            />

            <Button type="submit" variant="primary" pending={preguntar.isPending}>
              {messages.assistant.send}
            </Button>
          </form>
        </div>

        {ancho && (
          <aside className="flex w-card shrink-0 flex-col items-center gap-4">

            <Mascota pose="idea" size="large" />

            <div className="w-full">{sugerencias}</div>
          </aside>
        )}
      </div>
    </section>
  );
}

function Conversacion({
  turnos,
  esperando,
}: {
  turnos: Dicho[];
  esperando: boolean;
}): React.ReactElement | null {
  if (turnos.length === 0 && !esperando) {
    return null;
  }

  return (
    <ul aria-live="polite" className="flex list-none flex-col gap-3 p-0">
      {turnos.map((turno) => (
        <Turno key={turno.key} turno={turno} />
      ))}

      {esperando && (
        <li className="flex items-end gap-2">
          <Mascota pose="saluda" size="small" />
          <div className="rounded-panel flex max-w-reading flex-col gap-2 bg-coin-soft px-4 py-3">
            <p className="text-small m-0 font-semibold text-coin-ink">
              {messages.assistant.monedin}
            </p>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
            <p className="sr-only">{messages.assistant.thinking}</p>
          </div>
        </li>
      )}
    </ul>
  );
}

function Turno({ turno }: { turno: Dicho }): React.ReactElement {
  const esDeMonedin = turno.role === "assistant";

  return (
    <li className={cx("flex items-end gap-2", esDeMonedin ? "justify-start" : "justify-end")}>
      {esDeMonedin && <Mascota pose="saluda" size="small" />}

      <div
        className={cx(
          "rounded-panel flex max-w-reading flex-col gap-1 px-4 py-3",
          esDeMonedin ? "bg-coin-soft" : "bg-primary-soft",
        )}
      >
        <p
          className={cx(
            "text-small m-0 font-semibold",
            esDeMonedin ? "text-coin-ink" : "text-primary-hover",
          )}
        >
          {esDeMonedin ? messages.assistant.monedin : messages.assistant.you}
        </p>

        <p className="m-0 whitespace-pre-wrap text-body text-ink">{turno.text}</p>
      </div>
    </li>
  );
}

function Sugerencias({
  onElegir,
  disabled,
}: {
  onElegir: (pregunta: string) => void;
  disabled: boolean;
}): React.ReactElement {
  const a = messages.assistant;

  const esPadre = useSession().session?.actor?.familyRole === "PARENT";

  const ideas = esPadre
    ? [
        { glifo: a.ideaPriceGlyph, texto: a.ideaPrice },
        { glifo: a.ideaRetireGlyph, texto: a.ideaRetire },
        { glifo: a.ideaCreditedGlyph, texto: a.ideaCredited },
      ]
    : [
        { glifo: a.ideaBalanceGlyph, texto: a.ideaBalance },
        { glifo: a.ideaTasksGlyph, texto: a.ideaTasks },
        { glifo: a.ideaRewardsGlyph, texto: a.ideaRewards },
      ];

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-body m-0 font-semibold text-ink">{a.ideasTitle}</p>

      <div className="flex flex-wrap gap-2">
        {ideas.map(({ glifo, texto }) => (
          <Button
            key={texto}
            variant="secondary"
            disabled={disabled}
            onClick={() => { onElegir(texto); }}
          >

            <span aria-hidden="true" className="mr-2">
              {glifo}
            </span>
            {texto}
          </Button>
        ))}
      </div>
    </Card>
  );
}

function SaludoDeMonedin(): React.ReactElement {
  const actor = useSession().session?.actor;

  return (
    <ul className="flex list-none flex-col gap-3 p-0">
      {actor?.familyRole === "CHILD" ? <SaludoAlNino name={actor.name} coins={actor.coins} /> : null}
      {actor?.familyRole === "PARENT" ? <SaludoAlPadre name={actor.name} /> : null}
    </ul>
  );
}

function SaludoAlNino({ name, coins }: { name: string; coins: number }): React.ReactElement {
  const { data } = useOwnTasks();
  const pendientes = (data?.items ?? []).filter((tarea) => tarea.status === "PENDING").length;

  const saldo = contar(coins, messages.ui.coinsUnitSingular, messages.ui.coinsUnit);
  const tareas = contar(
    pendientes,
    messages.children.homePendingOne,
    messages.children.homePendingMany,
  );

  return (
    <Turno
      turno={{
        key: "saludo",
        role: "assistant",
        text: `${messages.children.homeGreeting} ${name}. ${messages.assistant.greetHave} ${saldo} ${messages.assistant.greetAnd} ${tareas}. ${messages.assistant.greetAskChild}`,
      }}
    />
  );
}

function SaludoAlPadre({ name }: { name: string }): React.ReactElement {
  const { tasksToApprove, redemptionsWaiting } = usePendingCounts();

  const tareas = contar(
    tasksToApprove.value,
    messages.parents.taskToApprove,
    messages.parents.tasksToApprove,
  );
  const canjes = contar(
    redemptionsWaiting.value,
    messages.parents.redemptionWaiting,
    messages.parents.redemptionsWaiting,
  );

  return (
    <Turno
      turno={{
        key: "saludo",
        role: "assistant",
        text: `${messages.parents.greeting} ${name}. ${messages.assistant.greetHave} ${tareas} ${messages.assistant.greetAnd} ${canjes}. ${messages.assistant.greetAskParent}`,
      }}
    />
  );
}
