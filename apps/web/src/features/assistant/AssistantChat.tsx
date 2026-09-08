import { ASSISTANT_MAX_HISTORY_TURNS, ASSISTANT_QUESTION_MAX_LENGTH } from "@monedin/contracts";
import type { AssistantTurn } from "@monedin/contracts";
import { useState } from "react";
import { alertToneFor } from "../../lib/alert-tone.js";
import { messages } from "../../lib/messages.js";
import { Alert, Button, Card, Field, Input, Skeleton } from "../../ui/index.js";
import { cx } from "../../ui/cx.js";
import { describeAssistantError, useAskAssistant } from "./use-assistant.js";

/**
 * El chat con Monedín.
 *
 * UNA sola pantalla para los dos roles. El marco ya declara `data-scale`, así
 * que las mismas piezas rinden con cifras grandes y objetivos de toque de 44px
 * para el niño sin duplicar nada. Dos pantallas cuya única diferencia fuera la
 * audiencia son un defecto declarado del proyecto.
 *
 * EL HILO VIVE EN `useState`, Y ESO ES LO CONTRARIO DE `?manage=true`.
 *
 * Conviene anticipar la comparación, porque un revisor la va a hacer:
 * `redesign-profile-grid` sacó el modo «administrar» de un `useState` a la
 * dirección porque tenía que SOBREVIVIR a una navegación. Este tiene que MORIR
 * con ella, y por decisión de producto: no se persiste nada, ni en la base ni en
 * el navegador. Es la misma regla leída en la otra dirección.
 *
 * Tampoco choca con el test que prohíbe el estado haciendo de router: aquel
 * persigue uniones de vistas y props para cerrarse. Esto es una lista de
 * mensajes, no una decisión sobre qué pantalla se enseña.
 */

/** Un turno ya dicho, o el que se está esperando. */
interface Dicho extends AssistantTurn {
  key: string;
}

export function AssistantChat(): React.ReactElement {
  const [turnos, setTurnos] = useState<Dicho[]>([]);
  // Lo que hay escrito en el campo. Se CONSERVA si la petición falla.
  const [borrador, setBorrador] = useState("");
  const preguntar = useAskAssistant();

  const error = preguntar.error === null ? null : describeAssistantError(preguntar.error);

  function enviar(pregunta: string): void {
    const limpia = pregunta.trim();
    if (limpia === "" || preguntar.isPending) {
      return;
    }

    /*
     * NUNCA leer, componer en memoria y escribir. La regla estaba escrita para
     * el saldo —con `increment` y `decrement`— y el teclado de PIN demostró que
     * vale igual en el front: `pin + digit` leído del cierre perdía dígitos
     * cuando llegaban más rápido de lo que React repinta.
     *
     * Aquí muerde por lo mismo: se añaden DOS turnos seguidos —la pregunta al
     * enviar y la respuesta al llegar— y el segundo no puede leer `turnos` del
     * cierre del primero. Quien conoce el valor actual es el pintado siguiente,
     * no quien pidió el cambio.
     */
    setTurnos((actual) => [
      ...actual,
      { key: `${String(actual.length)}-user`, role: "user", text: limpia },
    ]);
    setBorrador("");

    preguntar.mutate(
      {
        question: limpia,
        // El recorte ocurre AQUÍ y en un solo sitio. El servidor no vuelve a
        // acotar: dos acotaciones son dos que pueden separarse.
        history: turnos
          .slice(-ASSISTANT_MAX_HISTORY_TURNS)
          .map(({ role, text }) => ({ role, text })),
      },
      {
        onSuccess: ({ answer }) => {
          setTurnos((actual) => [
            ...actual,
            { key: `${String(actual.length)}-monedin`, role: "assistant", text: answer },
          ]);
        },
      },
    );
  }

  /*
   * Reintentar la ÚLTIMA pregunta.
   *
   * Al fallar, la pregunta se queda en el hilo y desde ahí se reintenta. Borrar
   * lo que alguien acaba de escribir es la peor respuesta a un fallo que no es
   * suyo — es la lección de la tecla de borrar del teclado de PIN, donde
   * obligar a rehacer el gesto costaba un intento.
   */
  const ultima = turnos.at(-1);
  const puedeReintentar = error !== null && ultima?.role === "user";

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-hero font-bold text-ink">{messages.assistant.title}</h1>
        <p className="text-body text-ink-muted">{messages.assistant.lead}</p>
      </header>

      {turnos.length === 0 ? (
        <Ideas onElegir={enviar} disabled={preguntar.isPending} />
      ) : (
        /*
         * `aria-live="polite"` para que un lector de pantalla anuncie la
         * respuesta cuando llega: nadie va a estar tabulando aquí a la espera.
         */
        <ul
          aria-live="polite"
          className="flex list-none flex-col gap-3 p-0"
        >
          {turnos.map((turno) => (
            <Turno key={turno.key} turno={turno} />
          ))}

          {preguntar.isPending && (
            <li>
              <Card className="flex flex-col gap-2">
                <p className="text-small font-semibold text-ink-muted">
                  {messages.assistant.monedin}
                </p>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <p className="sr-only">{messages.assistant.thinking}</p>
              </Card>
            </li>
          )}
        </ul>
      )}

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

      {/*
        Una pantalla donde se escribe es un `<form>`, para que Enter envíe. Con
        un `<section>` y un `type="button"` la misma tecla respondería distinto
        aquí que en el formulario de al lado.
      */}
      <form
        className="flex items-end gap-2"
        onSubmit={(evento) => {
          evento.preventDefault();
          enviar(borrador);
        }}
      >
        <div className="min-w-0 flex-1">
          <Field label={messages.assistant.inputLabel}>
            <Input
              value={borrador}
              onChange={(evento) => { setBorrador(evento.target.value); }}
              placeholder={messages.assistant.placeholder}
              // Desde la constante del contrato, nunca un literal: tenerlo en
              // dos sitios acaba con uno de los dos mintiendo.
              maxLength={ASSISTANT_QUESTION_MAX_LENGTH}
              autoComplete="off"
            />
          </Field>
        </div>

        <Button type="submit" variant="primary" pending={preguntar.isPending}>
          {messages.assistant.send}
        </Button>
      </form>
    </section>
  );

  /** Reintentar no vuelve a apilar la pregunta: ya está en el hilo. */
  function enviarDeNuevo(pregunta: string): void {
    preguntar.mutate(
      {
        question: pregunta,
        history: turnos
          .slice(0, -1)
          .slice(-ASSISTANT_MAX_HISTORY_TURNS)
          .map(({ role, text }) => ({ role, text })),
      },
      {
        onSuccess: ({ answer }) => {
          setTurnos((actual) => [
            ...actual,
            { key: `${String(actual.length)}-monedin`, role: "assistant", text: answer },
          ]);
        },
      },
    );
  }
}

/**
 * Un turno, con QUIÉN habla escrito y no solo pintado.
 *
 * El color no puede ser lo único que distinga a Monedín de quien pregunta: para
 * quien no ve la pantalla, dos párrafos seguidos sin etiqueta son la misma voz.
 */
function Turno({ turno }: { turno: Dicho }): React.ReactElement {
  const esDeMonedin = turno.role === "assistant";

  return (
    <li>
      <Card
        raised={esDeMonedin}
        className={cx("flex flex-col gap-1", esDeMonedin ? "bg-surface-raised" : "bg-surface-sunken")}
      >
        <p className="text-small font-semibold text-ink-muted">
          {esDeMonedin ? messages.assistant.monedin : messages.assistant.you}
        </p>
        {/*
          Texto PLANO, nunca marcado. Lo que responde el modelo no lo escribimos
          nosotros, así que no se interpreta: es la otra mitad de que no exista
          camino de código desde una respuesta hacia una mutación.
        */}
        <p className="whitespace-pre-wrap text-body text-ink">{turno.text}</p>
      </Card>
    </li>
  );
}

/** Arranques sugeridos: una pantalla vacía no debería ser un folio en blanco. */
function Ideas({
  onElegir,
  disabled,
}: {
  onElegir: (pregunta: string) => void;
  disabled: boolean;
}): React.ReactElement {
  const ideas = [
    messages.assistant.ideaBalance,
    messages.assistant.ideaTasks,
    messages.assistant.ideaRewards,
  ];

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-body font-semibold text-ink">{messages.assistant.ideasTitle}</p>
      <div className="flex flex-wrap gap-2">
        {ideas.map((idea) => (
          <Button
            key={idea}
            variant="secondary"
            disabled={disabled}
            onClick={() => { onElegir(idea); }}
          >
            {idea}
          </Button>
        ))}
      </div>
    </Card>
  );
}
