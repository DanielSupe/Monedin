import { createFileRoute } from "@tanstack/react-router";
import { requireSignedOut } from "../app/guards.js";
import { SignUpScreen } from "../features/auth/SignUpScreen.js";

/**
 * Crear cuenta. Su propia dirección desde `redesign-access`.
 *
 * Antes era un estado de la pantalla de acceso, así que recargar perdía cuál
 * era y el botón atrás sacaba de la aplicación. La guarda es la misma que la de
 * entrar y va en la dirección contraria a las demás: a quien ya tiene cuenta no
 * se le enseña un formulario que no necesita.
 */
export const Route = createFileRoute("/sign-up")({
  beforeLoad: ({ context }) => requireSignedOut(context.queryClient),
  component: SignUpScreen,
});
