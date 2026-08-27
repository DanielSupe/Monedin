import { createFileRoute } from "@tanstack/react-router";
import { requireSignedOut } from "../app/guards.js";
import { SignInScreen } from "../features/auth/SignInScreen.js";

/**
 * Entrar o crear cuenta. Una de las dos rutas públicas del sistema.
 *
 * La guarda va en la dirección contraria a las demás: a quien ya tiene cuenta
 * no se le enseña un formulario de acceso que no necesita.
 */
export const Route = createFileRoute("/sign-in")({
  beforeLoad: ({ context }) => requireSignedOut(context.queryClient),
  component: SignInScreen,
});
