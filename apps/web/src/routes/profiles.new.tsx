import { createFileRoute } from "@tanstack/react-router";
import { requireProfileChoice } from "../app/guards.js";
import { CreateProfileScreen } from "../features/children/CreateProfileScreen.js";

export const Route = createFileRoute("/profiles/new")({
  beforeLoad: ({ context }) => requireProfileChoice(context.queryClient),
  component: CreateProfileScreen,
});
