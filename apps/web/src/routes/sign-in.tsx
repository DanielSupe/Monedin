import { createFileRoute } from "@tanstack/react-router";
import { requireSignedOut } from "../app/guards.js";
import { SignInScreen } from "../features/auth/SignInScreen.js";

/**
 * Entrar con una cuenta que ya existe.
 *
 * Crear cuenta es `/sign-up`, un destino aparte desde `redesign-access`: eran
 * dos pantallas decididas con un `useState`.
 *
 * La guarda va en la dirección contraria a las demás: a quien ya tiene cuenta
 * no se le enseña un formulario de acceso que no necesita.
 */
export const Route = createFileRoute("/sign-in")({
  beforeLoad: ({ context }) => requireSignedOut(context.queryClient),
  component: SignInScreen,
});
