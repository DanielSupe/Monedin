import { createFileRoute } from "@tanstack/react-router";
import { requireSignedOut } from "../app/guards.js";
import { SignUpScreen } from "../features/auth/SignUpScreen.js";

export const Route = createFileRoute("/sign-up")({
  staticData: { fullBleed: true },
  beforeLoad: ({ context }) => requireSignedOut(context.queryClient),
  component: SignUpScreen,
});
