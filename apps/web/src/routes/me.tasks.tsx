import { createFileRoute } from "@tanstack/react-router";
import { requireChild } from "../app/guards.js";
import { MyTasks } from "../features/tasks/MyTasks.js";

export const Route = createFileRoute("/me/tasks")({
  beforeLoad: ({ context }) => requireChild(context.queryClient),
  component: MyTasks,
});
