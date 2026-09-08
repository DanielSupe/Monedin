import { createFileRoute } from "@tanstack/react-router";
import { requireActor } from "../app/guards.js";
import { AssistantChat } from "../features/assistant/AssistantChat.js";

/**
 * El chat con Monedin.
 *
 * `requireActor` y no `requireParent` ni `requireChild`: es de los DOS roles, y
 * es el primer destino compartido del proyecto. Sin actor no hay contexto que
 * cargar, asi que la cookie de cuenta no basta — es lo mismo que exige la ruta
 * de la API.
 *
 * El archivo monta el destino y no lo dibuja.
 */
export const Route = createFileRoute("/assistant")({
  beforeLoad: ({ context }) => requireActor(context.queryClient),
  component: AssistantChat,
});
