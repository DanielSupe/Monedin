import { messages } from "../../lib/messages.js";
import { Avatar, Badge, Card, Coins } from "../../ui/index.js";

/**
 * Las dos caras de la aplicación, sin salir de la puerta pública.
 *
 * La página no enseñaba la aplicación ni una vez: quien duda si esto le sirve
 * no veía nunca lo que va a usar, ni lo que va a usar su hijo — que es de lo que
 * va el producto.
 *
 * Se enseñan LAS DOS. Solo el panel del padre deja fuera aquello de lo que va
 * todo; solo el del niño le oculta al adulto lo que él usará a diario.
 *
 * CONSTRUIDAS con las piezas y los tokens reales, no capturadas, por dos
 * razones y la segunda es la que decide:
 *
 *   1. Una captura envejece EN SILENCIO cuando el sistema de diseño cambia. Un
 *      token nuevo repinta esto y no repinta un PNG, y nadie se entera hasta que
 *      alguien mira la landing.
 *   2. Cada maqueta lleva su `data-scale` DE VERDAD, así que la diferencia entre
 *      las dos audiencias que la página enseña es la del producto y no una
 *      imitación a ojo.
 *
 * Y por eso el test de que la puerta pública no lleva escala pasó a mirar la
 * RAÍZ: la página no adopta el marco de un rol, pero una maqueta que enseña las
 * dos escalas necesita llevarlas. Ver la decisión 3 del design de
 * `redesign-public-entry`.
 *
 * Cada maqueta se anuncia como EJEMPLO: sin eso, quien recorre la página sin
 * verla oye un saldo y dos nombres de niño y no tiene forma de saber que no son
 * de nadie.
 */

/** Cifras de ejemplo. No son de nadie, y la maqueta lo dice. */
const TAREAS_ESPERANDO = 3;
const SALDO_MATEO = 129;
const SALDO_EMMA = 340;

export function AppPreview(): React.ReactElement {
  return (
    <section className="bg-surface-sunken">
      <div className="mx-auto flex w-full max-w-(--container-wide) flex-col gap-8 px-4 py-12">
        <div className="flex flex-col gap-3">
          <h2 className="text-title font-extrabold">{messages.landing.previewTitle}</h2>
          <p className="text-body max-w-(--container-reading) text-ink-muted">
            {messages.landing.previewBody}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Maqueta etiqueta={messages.landing.previewParentTag}>
            {/*
              La escala DE VERDAD, no una imitación: es lo que hace que la
              diferencia que se ve sea la que existe en el producto.
            */}
            <div
              data-scale="parent"
              role="img"
              aria-label={messages.landing.previewParentLabel}
              className="rounded-card flex flex-col gap-3 border border-border bg-surface p-4"
            >
              <Card>
                <div className="flex flex-col gap-1">
                  <p className="text-small text-ink-muted">{messages.landing.previewPending}</p>
                  <p className="text-title font-bold">
                    {TAREAS_ESPERANDO} {messages.landing.previewPendingTasks}
                  </p>
                </div>
              </Card>

              <Card>
                <div className="flex flex-col gap-3">
                  <p className="text-small text-ink-muted">{messages.landing.previewChildren}</p>
                  {[
                    { nombre: messages.landing.previewChildOne, avatar: "zorro", saldo: SALDO_MATEO },
                    { nombre: messages.landing.previewChildTwo, avatar: "koala", saldo: SALDO_EMMA },
                  ].map((hijo) => (
                    <div key={hijo.nombre} className="flex items-center gap-3">
                      <Avatar value={hijo.avatar} size="small" />
                      <span className="text-body flex-1 font-semibold">{hijo.nombre}</span>
                      <Coins amount={hijo.saldo} />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </Maqueta>

          <Maqueta etiqueta={messages.landing.previewChildTag}>
            <div
              data-scale="child"
              role="img"
              aria-label={messages.landing.previewChildLabel}
              className="rounded-card flex flex-col gap-3 border border-border bg-surface p-4"
            >
              <Card>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-body font-bold">{messages.landing.previewChildGreeting}</p>
                  <Coins amount={SALDO_MATEO} size="hero" />
                  <span className="text-small text-ink-muted">
                    {messages.landing.previewChildBalance}
                  </span>
                </div>
              </Card>

              {/*
                Dos teselas y no cuatro: la maqueta enseña la ESCALA, y con
                cuatro en media columna cada una saldría más pequeña que en el
                producto — que es justo lo contrario de lo que hay que enseñar.
              */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { glifo: "🧹", texto: messages.landing.previewChildTasks },
                  { glifo: "🎁", texto: messages.landing.previewChildRewards },
                ].map((tesela) => (
                  <div
                    key={tesela.texto}
                    className="rounded-card flex flex-col items-center gap-1 border border-border bg-surface-raised p-4 text-center"
                  >
                    <span aria-hidden="true" className="text-title leading-none">
                      {tesela.glifo}
                    </span>
                    <span className="text-small font-semibold">{tesela.texto}</span>
                  </div>
                ))}
              </div>
            </div>
          </Maqueta>
        </div>
      </div>
    </section>
  );
}

/** El marco de una maqueta: su etiqueta encima y la pantalla debajo. */
function Maqueta({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <Badge tone="info">{etiqueta}</Badge>
      {children}
    </div>
  );
}
