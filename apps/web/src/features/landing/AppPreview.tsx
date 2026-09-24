import { messages } from "../../lib/messages.js";
import { Avatar, Badge, Card, Coins } from "../../ui/index.js";

const TAREAS_ESPERANDO = 3;
const SALDO_MATEO = 129;
const SALDO_EMMA = 340;

export function AppPreview(): React.ReactElement {
  return (
    <section className="bg-surface-sunken">
      <div className="mx-auto flex w-full max-w-(--container-wide) flex-col gap-8 px-4 py-12">
        <div className="flex flex-col gap-3">
          <h2 className="text-display font-extrabold">{messages.landing.previewTitle}</h2>
          <p className="text-body max-w-(--container-reading) text-ink-muted">
            {messages.landing.previewBody}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Maqueta etiqueta={messages.landing.previewParentTag} pie={messages.landing.previewParentLabel}>

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

          <Maqueta etiqueta={messages.landing.previewChildTag} pie={messages.landing.previewChildLabel}>
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

function Maqueta({
  etiqueta,
  pie,
  children,
}: {
  etiqueta: string;

  pie: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <Badge tone="info">{etiqueta}</Badge>
      {children}

      <p className="text-micro text-ink-muted">{`${pie} ${messages.landing.previewNotOurs}`}</p>
    </div>
  );
}
