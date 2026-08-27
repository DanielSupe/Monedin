import { createFileRoute } from "@tanstack/react-router";
import { requireProfileChoice } from "../app/guards.js";
import { CreateProfileScreen } from "../features/children/CreateProfileScreen.js";

/**
 * Alta de un perfil desde la rejilla, SIN haber elegido perfil.
 *
 * Es la quinta ruta de solo cuenta del sistema: `POST /children` se conforma con
 * la cuenta acreditada porque crear un perfil es otro de los pasos previos a ser
 * alguien. Sin esto, una familia recién registrada llegaría a una rejilla con un
 * solo perfil y ninguna salida.
 */
export const Route = createFileRoute("/profiles/new")({
  beforeLoad: ({ context }) => requireProfileChoice(context.queryClient),
  component: CreateProfileScreen,
});
