import { createFileRoute } from "@tanstack/react-router";
import { requireSignedOut } from "../app/guards.js";
import { SignInScreen } from "../features/auth/SignInScreen.js";

export const Route = createFileRoute("/sign-in")({
  staticData: { fullBleed: true },
  beforeLoad: ({ context }) => requireSignedOut(context.queryClient),
  component: SignInScreen,
});
