import type { ReactElement, ReactNode } from "react";
import { messages } from "../../lib/messages.js";
import { SignInScreen } from "./SignInScreen.js";
import { useSession } from "./use-session.js";

/**
 * Guarda de acceso.
 *
 * Sin sesión, lo único que se ve es la pantalla de acceso. Es la puerta del
 * front; la de verdad está en el servidor, que responde 401 a cualquier ruta
 * protegida sin sesión. Esta solo evita enseñar una interfaz que no va a
 * funcionar.
 */
export function AuthGate({ children }: { children: ReactNode }): ReactElement {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <p>{messages.health.loading}</p>;
  }

  if (session?.actor == null) {
    return <SignInScreen />;
  }

  return <>{children}</>;
}

/** Envuelve contenido que solo tiene sentido para un padre. */
export function ParentOnly({ children }: { children: ReactNode }): ReactElement | null {
  const { session } = useSession();

  return session?.actor?.familyRole === "PARENT" ? <>{children}</> : null;
}

/** Envuelve contenido que solo tiene sentido para un niño. */
export function ChildOnly({ children }: { children: ReactNode }): ReactElement | null {
  const { session } = useSession();

  return session?.actor?.familyRole === "CHILD" ? <>{children}</> : null;
}
