import { Link } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { Logo, Mascota, buttonClasses } from "../../ui/index.js";
import { AppPreview } from "./AppPreview.js";
import { FinalCta } from "./FinalCta.js";
import { HowItWorks } from "./HowItWorks.js";
import { Orbits } from "./Orbits.js";
import { useTypewriter } from "./use-typewriter.js";

export function LandingPage(): React.ReactElement {
  return (
    <div data-scale="public" className="flex min-h-dvh flex-col bg-surface text-ink">
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

        <div className="relative flex w-full shrink-0 justify-center lg:w-auto">
          <div
            aria-hidden="true"
            className="absolute inset-0 m-auto size-(--container-orbit) rounded-pill bg-primary-soft opacity-60 blur-3xl"
          />
          <Orbits />
        </div>
      </main>

      <About />

      <HowItWorks />

      <AppPreview />

      <FinalCta />
    </div>
  );
}

function Hero(): React.ReactElement {
  const titular = useTypewriter(messages.landing.headline, { speed: 35, delay: 300 });

  return (
    <section className="flex min-w-0 flex-1 flex-col items-start gap-5">

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

function About(): React.ReactElement {
  return (
    <section className="bg-surface-sunken">
      <div className="mx-auto flex w-full max-w-(--container-wide) flex-col items-center gap-8 px-4 py-12 lg:flex-row lg:gap-12">

        <Mascota pose="explica" size="large" className="shrink-0" />

        <div className="flex min-w-0 flex-col gap-4">
          <h2 className="text-display font-extrabold">{messages.landing.aboutTitle}</h2>
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
