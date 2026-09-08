import { createFileRoute } from "@tanstack/react-router";
import { requireActor } from "../app/guards.js";
import { HelpScreen } from "../features/help/HelpScreen.js";

/**
 * Las preguntas frecuentes.
 *
 * `/help` y no `/faq`: las rutas van en ingles, «faq» es jerga, y el destino
 * puede crecer —una guia, un contacto— sin renombrarse.
 *
 * `requireActor` y no `requireParent` ni `requireChild`: es de los DOS roles, el
 * segundo destino compartido del proyecto despues del chat. Que sea de los dos
 * no lo hace publico: sin perfil elegido se sigue aterrizando en la rejilla.
 *
 * El archivo monta el destino y no lo dibuja.
 */
export const Route = createFileRoute("/help")({
  beforeLoad: ({ context }) => requireActor(context.queryClient),
  component: HelpScreen,
});
