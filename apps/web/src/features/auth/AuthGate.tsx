import type { ReactElement, ReactNode } from "react";
import { messages } from "../../lib/messages.js";
import { ProfileGrid } from "./ProfileGrid.js";
import { SignInScreen } from "./SignInScreen.js";
import { screenFor, useSession } from "./use-session.js";

/**
 * Guarda de acceso, con TRES estados y no dos.
 *
 * Sin cuenta, la pantalla de acceso. Con cuenta y sin perfil elegido, la
 * rejilla: es la ruta raíz del front, no una pantalla que cuelga de dentro de
 * la aplicación (decisión 7 del design de `add-profile-selection`). Con perfil
 * activo, la aplicación.
 *
 * La de verdad está en el servidor, que responde 401 a cualquier ruta
 * protegida sin el nivel que le corresponde. Esta solo evita enseñar una
 * interfaz que no va a funcionar.
 */
export function AuthGate({ children }: { children: ReactNode }): ReactElement {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <p>{messages.health.loading}</p>;
  }

  switch (screenFor(session)) {
    case "signIn":
      return <SignInScreen />;
    case "profiles":
      return <ProfileGrid />;
    case "app":
      return <>{children}</>;
  }
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
