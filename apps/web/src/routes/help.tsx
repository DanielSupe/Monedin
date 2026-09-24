import { createFileRoute } from "@tanstack/react-router";
import { requireActor } from "../app/guards.js";
import { HelpScreen } from "../features/help/HelpScreen.js";

export const Route = createFileRoute("/help")({
  beforeLoad: ({ context }) => requireActor(context.queryClient),
  component: HelpScreen,
});
