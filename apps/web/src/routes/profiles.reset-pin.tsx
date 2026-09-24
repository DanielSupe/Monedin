import { createFileRoute } from "@tanstack/react-router";
import { requireProfileChoice } from "../app/guards.js";
import { ResetPinScreen } from "../features/auth/ResetPinScreen.js";

export const Route = createFileRoute("/profiles/reset-pin")({
  beforeLoad: ({ context }) => requireProfileChoice(context.queryClient),
  component: ResetPinScreen,
});
