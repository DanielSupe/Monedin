import { createFileRoute } from "@tanstack/react-router";
import { requireAccount } from "../app/guards.js";
import { ProfileGrid } from "../features/auth/ProfileGrid.js";

/**
 * La rejilla «¿quién eres?».
 *
 * Es de SOLO CUENTA: la cookie de cuenta certifica que el dispositivo pertenece
 * a una familia, y aquí todavía no hay actor. Entrar a un perfil es lo que lo
 * crea, así que exigirlo de antemano dejaría a la familia sin puerta.
 */
export const Route = createFileRoute("/profiles/")({
  beforeLoad: ({ context }) => requireAccount(context.queryClient),
  component: ProfileGrid,
});
