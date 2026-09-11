import { ASSISTANT_MAX_HISTORY_TURNS, ASSISTANT_QUESTION_MAX_LENGTH } from "@monedin/contracts";
import type { AssistantTurn } from "@monedin/contracts";
import { useEffect, useRef, useState } from "react";
import { useIsWide } from "../../app/use-wide.js";
import { alertToneFor } from "../../lib/alert-tone.js";
import { messages } from "../../lib/messages.js";
import { Alert, Button, Card, HeroPanel, Input, Mascota, Skeleton } from "../../ui/index.js";
import { cx } from "../../ui/cx.js";
import { describeAssistantError, useAskAssistant } from "./use-assistant.js";

/**
 * El chat con Monedín.
 *
 * UNA sola pantalla para los dos roles. El marco ya declara `data-scale`, así
 * que las mismas piezas rinden con cifras grandes y objetivos de toque de 44px
 * para el niño sin duplicar nada.
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
  const ancho = useIsWide();

  const error = preguntar.error === null ? null : describeAssistantError(preguntar.error);
  const vacio = turnos.length === 0;

  /*
   * El hilo baja al mensaje nuevo.
   *
   * Sin esto, la respuesta que se acaba de pedir aparece FUERA de la vista: el
   * hilo desplaza por dentro, así que crece hacia abajo y la parte visible se
   * queda donde estaba. Se ve enseguida al usarlo y no lo caza ningún test de
   * los que miran texto, porque el nodo SÍ está en el documento.
   *
   * `scrollTop = scrollHeight` y no `scrollIntoView({ behavior: "smooth" })`: el
   * salto es instantáneo, así que no hay movimiento que apagar con la
   * preferencia del sistema. Un desplazamiento suave sería una animación más que
   * envolver en `motion-safe:`, para ganar muy poco.
   */
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
      { onSuccess: ({ answer }) => { anotarRespuesta(answer); } },
    );
  }

  function anotarRespuesta(answer: string): void {
    setTurnos((actual) => [
      ...actual,
      { key: `${String(actual.length)}-monedin`, role: "assistant", text: answer },
    ]);
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
    /*
      LA PANTALLA SE ATA A LA VENTANA Y DESPLAZA POR DENTRO.

      Es la única del producto que lo hace, y por eso su ruta declara
      `fullHeight`: el hilo crece hacia arriba y el campo de escribir se queda
      abajo, como en cualquier mensajería. Con el documento desplazando, ese
      campo se iría con los mensajes y habría que perseguirlo para escribir la
      siguiente pregunta.

      `min-h-0` en cada eslabón de la cadena, que es lo que cuesta acertar: un
      hijo de un contenedor flexible deja `min-height: auto` por defecto, así que
      basta que falte en uno para que el contenido lo empuje y el desplazamiento
      se escape al marco.
    */
    <section className="flex h-full min-h-0 flex-col gap-4">
      {/*
        La cabecera es el realce del sistema y no un título suelto: esta pantalla
        no tiene contenido hasta que alguien escribe, así que sin ella el hilo
        vacío empieza con una frase gris en la esquina. La mascota grande de la
        derecha NO la sustituye — no se monta en estrecho.
      */}
      <HeroPanel className="shrink-0" mascot={<Mascota pose="celebra" size="medium" />}>
        <h2 className="text-title m-0 font-extrabold text-ink-inverted">
          {messages.assistant.title}
        </h2>
        <p className="text-body m-0 text-ink-inverted opacity-90">{messages.assistant.lead}</p>
      </HeroPanel>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex min-w-0 min-h-0 flex-1 flex-col gap-3">
          {/* Lo ÚNICO que desplaza. El campo de abajo queda fuera a propósito. */}
          <div ref={hilo} className="min-h-0 flex-1 overflow-y-auto">
            {vacio ? (
              /*
                El hueco no se queda en blanco: dice para qué sirve.

                En tinta atenuada y sin acción — no es un aviso ni un error, y
                darle un botón lo convertiría en algo que hay que atender. Las
                sugerencias, que sí son acciones, están al lado.
              */
              <p className="text-body flex h-full items-center justify-center px-6 text-center text-ink-muted opacity-70">
                {messages.assistant.emptyHint}
              </p>
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

          {/*
            Campo y acción en UNA fila, y SIEMPRE abajo: no se mueve haya cero
            mensajes o cincuenta. El rótulo no se dibuja —gastaba una línea para
            decir lo único que se puede hacer aquí— pero se conserva para quien
            no ve la pantalla, en `aria-label`.

            Sigue siendo un `<form>`: es lo que hace que Enter envíe.
          */}
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
              // Desde la constante del contrato, nunca un literal: tenerlo en
              // dos sitios acaba con uno de los dos mintiendo.
              maxLength={ASSISTANT_QUESTION_MAX_LENGTH}
              autoComplete="off"
              className="min-w-0 flex-1"
            />

            <Button type="submit" variant="primary" pending={preguntar.isPending}>
              {messages.assistant.send}
            </Button>
          </form>
        </div>

        {/*
          LA COLUMNA DE LA DERECHA NO EXISTE EN ESTRECHO.

          En un teléfono la pantalla es el chat y nada más: la mascota grande y
          las sugerencias comerían el alto que necesita el hilo, que es lo único
          que se va a leer ahí. No se esconden con CSS —se montarían igual para
          quien recorre el documento con teclado— sino que no se montan.

          Lo decide `useIsWide()`, el MISMO valor que elige la forma del lateral.
        */}
        {ancho && (
          <aside className="flex w-card shrink-0 flex-col items-center gap-4">
            {/*
              Monedín SIEMPRE, antes y después de que haya mensajes. Es con quien
              se está hablando; retirarlo al empezar la conversación dejaba la
              pantalla sin la cara que le da nombre.

              `idea` y no `saluda`: un saludo se agota al segundo mensaje, y esta
              ilustración está en pantalla toda la conversación. La que piensa
              acompaña igual de bien al hilo vacío que al décimo turno.
            */}
            <Mascota pose="idea" size="large" />

            <div className="w-full">{sugerencias}</div>
          </aside>
        )}
      </div>
    </section>
  );
}

/**
 * El hilo.
 *
 * Vacío no dibuja nada: lo que invita a empezar son las sugerencias, y una lista
 * vacía con un mensaje encima sería decirlo dos veces.
 */
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
    /*
      `aria-live="polite"` para que un lector anuncie la respuesta cuando llega:
      nadie va a estar tabulando aquí a la espera.
    */
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

/**
 * Un turno, distinguido por TRES señales a la vez.
 *
 * Cada una cubre lo que las otras no, y por eso están las tres:
 *
 * - POSICIÓN —lo propio a la derecha, lo de Monedín a la izquierda— es lo que se
 *   lee de un vistazo, sin procesar color ni texto.
 * - COLOR distingue con la pantalla en blanco y negro, o para quien no separa
 *   bien dos tonos.
 * - LA ETIQUETA ESCRITA SE QUEDA, aunque ahora no haga falta mirarla: es lo
 *   único de las tres que oye quien no ve la pantalla, y el requisito vigente
 *   dice que la respuesta se atribuye «y NO SOLO distinguida por un color».
 *   Hacerlo más bonito no puede romper eso.
 *
 * Y el globo NO ocupa el ancho completo: se ciñe a su texto con un tope. Un
 * bloque de borde a borde no se lee como algo que alguien dijo, y en una pantalla
 * ancha obliga a recorrer la línea entera para volver al principio del siguiente.
 *
 * El ÁMBAR de Monedín es la reasignación declarada de este change: el color de
 * la moneda cubre ahora la moneda y la mascota, porque Monedín ES una moneda. La
 * lista de archivos autorizados a usarlo está en `tests/ui/style-rules.test.ts`.
 */
function Turno({ turno }: { turno: Dicho }): React.ReactElement {
  /*
   * La ilustración del turno es DECORATIVA: quien dice de quién es el turno es
   * la etiqueta escrita, así que anunciarla además lo diría dos veces. Es lo que
   * hace que retirar la mascota grande en estrecho no la borre de la pantalla.
   */
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
        {/*
          Texto PLANO, nunca marcado. Lo que responde el modelo no lo escribimos
          nosotros, así que no se interpreta: es la otra mitad de que no exista
          camino de código desde una respuesta hacia una mutación.
        */}
        <p className="m-0 whitespace-pre-wrap text-body text-ink">{turno.text}</p>
      </div>
    </li>
  );
}

/**
 * «Explora con Monedín»: las preguntas de arranque.
 *
 * SE QUEDAN CON LA CONVERSACIÓN EMPEZADA, que es el cambio de fondo de este
 * rediseño. Dejan de resolver el folio en blanco y pasan a ser el atajo para
 * cambiar de tema sin escribir — para quien todavía escribe despacio, eso es la
 * diferencia entre seguir preguntando y cerrar.
 *
 * Y elegir una PREGUNTA, no rellena el campo: rellenarlo obligaría a un segundo
 * gesto para algo que ya estaba decidido al pulsar.
 */
function Sugerencias({
  onElegir,
  disabled,
}: {
  onElegir: (pregunta: string) => void;
  disabled: boolean;
}): React.ReactElement {
  const a = messages.assistant;

  const ideas = [
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
            {/* El glifo es DECORATIVO: lo que nombra la sugerencia es su texto. */}
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
