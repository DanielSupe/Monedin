import type { ReactNode } from "react";
import { messages } from "../../lib/messages.js";
import { Card } from "../../ui/index.js";
import { CycleStrip } from "./CycleStrip.js";

/**
 * Lo que comparten entrar y crear cuenta: el saludo, la cinta y la tarjeta.
 *
 * Recibe el formulario como HIJO y **no decide cuál enseñar**. Esa es la
 * diferencia con lo que había: antes un solo componente alternaba entre dos
 * formularios con `useState`, que es estado haciendo de router. Si este marco
 * tuviera un `if` sobre el modo, habríamos movido el problema en vez de
 * resolverlo. Ver la decisión 1 del design de `redesign-access`.
 *
 * El logo y el centrado los pone `EntryShell`, así que aquí no están.
 */
export function AccessLayout({
  lead,
  children,
}: {
  /** Qué se viene a hacer. Es lo único que distingue las dos pantallas arriba. */
  lead: string;
  children: ReactNode;
}): React.ReactElement {
  return (
    <section className="mx-auto flex w-full max-w-dialog flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-hero font-extrabold">{messages.auth.accessGreeting}</h2>
        <p className="text-body text-ink-muted">{lead}</p>
      </header>

      <CycleStrip />

      <Card>{children}</Card>
    </section>
  );
}
