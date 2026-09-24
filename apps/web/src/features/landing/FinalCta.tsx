import { Link } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { buttonClasses } from "../../ui/index.js";

export function FinalCta(): React.ReactElement {
  return (
    <section data-surface="brand" className="bg-brand text-ink">
      <div className="mx-auto flex w-full max-w-(--container-wide) flex-col items-start gap-4 px-4 py-12">
        <h2 className="text-display max-w-(--container-reading) font-extrabold">
          {messages.landing.closingTitle}
        </h2>
        <p className="text-body max-w-(--container-reading) text-ink-muted">
          {messages.landing.closingBody}
        </p>

        <Link
          to="/sign-up"
          className={buttonClasses("contrast", false, "large")}
        >
          {messages.landing.closingAction}
        </Link>
      </div>
    </section>
  );
}
