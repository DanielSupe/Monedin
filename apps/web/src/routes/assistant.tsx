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
 * `fullHeight` porque es la UNICA pantalla del producto que desplaza por
 * dentro: el hilo crece y el campo de escribir se queda abajo, como en
 * cualquier mensajeria. Con el documento desplazando, ese campo se iria hacia
 * abajo con los mensajes y habria que perseguirlo.
 *
 * El archivo monta el destino y no lo dibuja.
 */
export const Route = createFileRoute("/assistant")({
  beforeLoad: ({ context }) => requireActor(context.queryClient),
  staticData: { fullHeight: true },
  component: AssistantChat,
});
