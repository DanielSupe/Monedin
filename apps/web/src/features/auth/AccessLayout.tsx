import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { messages } from "../../lib/messages.js";
import { Logo } from "../../ui/index.js";
import { CycleDisc } from "./CycleDisc.js";

export function AccessLayout({
  lead,
  tagline,
  children,
  footer,
}: {
  lead: string;

  tagline: string;
  children: ReactNode;

  footer: ReactNode;
}): React.ReactElement {
  return (
    <div data-scale="entry" className="relative min-h-dvh overflow-hidden bg-surface-raised">

      <div aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-2/5 bg-brand lg:block" />

      <div
        aria-hidden="true"
        className="absolute -top-24 right-0 hidden size-96 rounded-pill bg-brand/10 blur-3xl lg:block"
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-(--container-wide) flex-col justify-center gap-6 lg:flex-row lg:items-stretch lg:justify-center lg:gap-10 lg:px-8 lg:py-12">
        <PresentationPanel tagline={tagline} />

        <section className="rounded-panel flex flex-col overflow-hidden bg-surface-raised text-ink shadow-raised max-lg:rounded-none lg:w-96 lg:shrink-0">
          <div
            data-surface="brand"

            className="flex flex-1 flex-col justify-center gap-6 bg-brand px-6 pt-10 pb-12 text-ink"
          >

            <div className="flex flex-col gap-1">
              <p className="text-small">{messages.auth.accessGreeting}</p>
              <h2 className="text-display font-extrabold">{lead}</h2>
            </div>

            {children}
          </div>

          <footer className="rounded-t-sheet -mt-6 bg-surface-raised px-6 py-6 text-center">
            {footer}
          </footer>
        </section>
      </div>
    </div>
  );
}

function PresentationPanel({ tagline }: { tagline: string }): React.ReactElement {
  return (
    <section className="rounded-panel flex flex-col justify-between gap-8 bg-surface-raised px-6 pt-6 pb-10 text-ink shadow-raised max-lg:rounded-none max-lg:shadow-none lg:mt-10 lg:mb-0 lg:w-96 lg:shrink-0 lg:px-8 lg:pt-8">

      <Link to="/welcome" className="self-start no-underline">
        <Logo size="medium" />
      </Link>

      <CycleDisc />

      <div className="flex flex-col gap-2">
        <p className="text-display font-bold">{tagline}</p>
        <p className="text-small text-ink-muted">{messages.landing.aboutTitle}</p>
      </div>
    </section>
  );
}
