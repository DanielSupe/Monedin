import { Link } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { Card, Logo, buttonClasses } from "../../ui/index.js";
import { Orbits } from "./Orbits.js";
import { useTypewriter } from "./use-typewriter.js";

/**
 * La puerta pública.
 *
 * Recibe a DOS personas distintas, y el diseño lo reconoce: quien no conoce
 * Monedín y quien lo usa a diario y perdió la sesión. Por eso «Entrar» y
 * «Empezar» pesan lo mismo — la proporción entre ambos se invierte con el
 * tiempo, y un diseño que optimiza solo para la conversión inicial envejece mal.
 *
 * No hace ni una petición: se muestra completa sin sesión y sin datos de nadie.
 */
export function LandingPage(): React.ReactElement {
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Logo size="medium" />

        <nav aria-label={messages.landing.signInHint} className="flex items-center gap-2">
          <Link to="/sign-in" className={buttonClasses("secondary")}>
            {messages.landing.signIn}
          </Link>
          <Link to="/sign-up" className={buttonClasses("primary")}>
            {messages.landing.start}
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-(--container-wide) flex-1 flex-col items-center gap-8 px-4 py-6 lg:flex-row lg:gap-12">
        <Hero />
        <div className="flex w-full shrink-0 justify-center lg:w-auto">
          <Orbits />
        </div>
      </main>

      <Promises />
    </div>
  );
}

function Hero(): React.ReactElement {
  const titular = useTypewriter(messages.landing.headline, { speed: 35, delay: 300 });

  // `min-w-0`: sin eso el titular largo fija el ancho mínimo de la columna y se
  // come el sitio de la visualización. Es el `min-width: auto` del flex, el
  // mismo defecto que ya apareció en los marcos de `add-app-shell`.
  return (
    <section className="flex min-w-0 flex-1 flex-col items-start gap-4">
      {/*
        El texto COMPLETO está siempre en el DOM y se anuncia entero; lo que se
        escribe letra a letra es una capa oculta a los lectores. Nadie debería
        oír un título deletreándose.
      */}
      <h1 className="text-hero font-extrabold">
        <span className="sr-only">{messages.landing.headline}</span>
        <span aria-hidden="true">
          {titular.text}
          {!titular.done && <span className="text-primary">|</span>}
        </span>
      </h1>

      <p className="text-body max-w-(--container-reading) text-ink-muted">
        {messages.landing.subhead}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {/*
          «Empezar» lleva al REGISTRO, no al acceso. Apuntaba a `/sign-in`, que
          abría el formulario de entrar, así que quien venía a registrarse
          aterrizaba en una pantalla que no podía usar. Ver el «Why» de
          `redesign-access`.
        */}
        <Link to="/sign-up" className={buttonClasses("primary")}>
          {messages.landing.start}
        </Link>
        <span className="text-small text-ink-muted">
          {messages.landing.signInHint}{" "}
          <Link to="/sign-in">{messages.landing.signIn}</Link>
        </span>
      </div>
    </section>
  );
}

/**
 * Las tres promesas, en el sitio donde la referencia ponía logos de socios.
 *
 * Monedín no tiene socios, y una franja de logos existe para prestar
 * credibilidad de terceros: sin terceros, o se inventan —y eso es poner
 * respaldos falsos en una página pública— o se rellena con adorno.
 */
function Promises(): React.ReactElement {
  const promesas = [
    {
      glifo: "🧹",
      titulo: messages.landing.promiseEarnTitle,
      cuerpo: messages.landing.promiseEarnBody,
    },
    {
      glifo: "🎁",
      titulo: messages.landing.promiseSpendTitle,
      cuerpo: messages.landing.promiseSpendBody,
    },
    {
      glifo: "✓",
      titulo: messages.landing.promiseApproveTitle,
      cuerpo: messages.landing.promiseApproveBody,
    },
  ];

  return (
    <section className="mx-auto grid w-full max-w-(--container-wide) gap-3 px-4 py-6 md:grid-cols-3">
      {promesas.map((promesa) => (
        <Card key={promesa.titulo}>
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="text-title">
              {promesa.glifo}
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-body font-bold">{promesa.titulo}</p>
              <p className="text-small text-ink-muted">{promesa.cuerpo}</p>
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
}
