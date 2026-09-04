import { Link } from "@tanstack/react-router";
import ilustracion from "../../assets/tutorial/explica.png";
import { messages } from "../../lib/messages.js";
import { Logo, buttonClasses } from "../../ui/index.js";
import { AppPreview } from "./AppPreview.js";
import { FinalCta } from "./FinalCta.js";
import { HowItWorks } from "./HowItWorks.js";
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
 *
 * Desde `redesign-public-entry` este archivo MONTA las secciones y ya no las
 * dibuja todas. Se había construido por partes y nunca se compuso como página:
 * cinco bloques seguidos sobre el mismo fondo, sin nada que marcara dónde
 * acababa uno.
 *
 * El RITMO sale de alternar las superficies que el sistema ya tiene, y no de
 * inventar fondos: `surface` y `surface-sunken` se turnan, y el cierre va en la
 * de marca — el mismo índigo del acceso, que es la otra pantalla que mira un
 * adulto, así que la página termina con el color al que lleva.
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

      <main className="mx-auto flex w-full max-w-(--container-wide) flex-col items-center gap-10 px-4 py-10 lg:flex-row lg:gap-12 lg:py-16">
        <Hero />

        {/*
          Las órbitas dejan de ser un adorno lateral. Son lo mejor que hay en
          esta página —dibujan el ciclo que el producto entero existe para
          enseñar— y estaban tratadas como una ilustración de relleno.

          El halo las apoya en la composición en vez de dejarlas flotando: es un
          degradado de la marca en su tono más suave, no un color nuevo.
        */}
        <div className="relative flex w-full shrink-0 justify-center lg:w-auto">
          <div
            aria-hidden="true"
            className="absolute inset-0 m-auto size-(--container-orbit) rounded-full bg-primary-soft opacity-60 blur-3xl"
          />
          <Orbits />
        </div>
      </main>

      <HowItWorks />

      <About />

      <AppPreview />

      <FinalCta />
    </div>
  );
}

function Hero(): React.ReactElement {
  const titular = useTypewriter(messages.landing.headline, { speed: 35, delay: 300 });

  // `min-w-0`: sin eso el titular largo fija el ancho mínimo de la columna y se
  // come el sitio de la visualización. Es el `min-width: auto` del flex, el
  // mismo defecto que ya apareció en los marcos de `add-app-shell`.
  return (
    <section className="flex min-w-0 flex-1 flex-col items-start gap-5">
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

      {/*
        La acción principal en su TALLA MAYOR, y con aire alrededor.

        Pesaba lo mismo que el botón de un formulario, y no es lo mismo: en un
        formulario que ya se está rellenando la acción se está mirando; en una
        página que convence hay que encontrarla.

        «Empezar» lleva al REGISTRO, no al acceso. Apuntaba a `/sign-in`, que
        abría el formulario de entrar, así que quien venía a registrarse
        aterrizaba en una pantalla que no podía usar. Ver el «Why» de
        `redesign-access`.
      */}
      <div className="flex flex-wrap items-center gap-4 pt-1">
        <Link to="/sign-up" className={buttonClasses("primary", false, "large")}>
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
 * Lo que la página no decía y decide un registro.
 *
 * El héroe dice qué hace el producto y el flujo cuenta el ciclo. Ninguno
 * contesta lo primero que piensa un adulto al leer «monedas» y «premios» en una
 * aplicación para su hijo: si esto mueve dinero de verdad.
 *
 * En ESPEJO del héroe —visual a la izquierda, texto a la derecha— y no por
 * simetría: dos franjas seguidas con el visual del mismo lado se leen como un
 * bloque repetido.
 *
 * Sobre `surface`, entre dos secciones hundidas: es el turno que le toca en la
 * alternancia que da ritmo a la página.
 */
function About(): React.ReactElement {
  return (
    <section className="bg-surface">
      <div className="mx-auto flex w-full max-w-(--container-wide) flex-col items-center gap-8 px-4 py-12 lg:flex-row lg:gap-12">
        {/*
          DECORATIVA, y es lo contrario de `Orbits`.

          Aquella lleva nombre porque comunica el ciclo: sin él, quien no la ve
          pierde algo que no está en ningún otro sitio. Esta acompaña a un texto
          que ya lo dice todo, así que anunciarla sería la misma frase dos veces.
        */}
        <img src={ilustracion} alt="" className="w-full max-w-tile shrink-0" />

        <div className="flex min-w-0 flex-col gap-4">
          <h2 className="text-title font-extrabold">{messages.landing.aboutTitle}</h2>
          <p className="text-body max-w-(--container-reading) text-ink-muted">
            {messages.landing.aboutBody}
          </p>
          <p className="text-body max-w-(--container-reading) text-ink-muted">
            {messages.landing.aboutLearns}
          </p>
        </div>
      </div>
    </section>
  );
}
