import { createFileRoute } from "@tanstack/react-router";
import { requireProfileChoice } from "../app/guards.js";
import { ResetPinScreen } from "../features/auth/ResetPinScreen.js";

/**
 * Restablecer el PIN de adulto con la contrasena.
 *
 * Via de rescate para un padre bloqueado fuera de su propio perfil: es de solo
 * cuenta a proposito, porque exigir perfil activo dejaria sin salida justo al
 * que no puede entrar al suyo.
 */
export const Route = createFileRoute("/profiles/reset-pin")({
  beforeLoad: ({ context }) => requireProfileChoice(context.queryClient),
  component: ResetPinScreen,
});
