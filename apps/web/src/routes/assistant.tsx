import { createFileRoute } from "@tanstack/react-router";
import { requireActor } from "../app/guards.js";
import { AssistantChat } from "../features/assistant/AssistantChat.js";

export const Route = createFileRoute("/assistant")({
  beforeLoad: ({ context }) => requireActor(context.queryClient),
  staticData: { fullHeight: true },
  component: AssistantChat,
});
