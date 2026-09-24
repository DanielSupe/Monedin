import type { Pose } from "../../ui/mascot-poses.js";
import { messages } from "../../lib/messages.js";

export interface TutorialStep {
  key: string;

  anchor?: string;
  title: string;
  body: string;

  pose: Pose;
}

export const PARENT_STEPS: TutorialStep[] = [
  {
    key: "bienvenida",
    title: messages.tutorial.parentWelcomeTitle,
    body: messages.tutorial.parentWelcomeBody,
    pose: "saluda",
  },
  {
    key: "pendientes",
    anchor: "parent-pending",
    title: messages.tutorial.parentPendingTitle,
    body: messages.tutorial.parentPendingBody,
    pose: "propone",
  },
  {
    key: "hijos",
    anchor: "parent-children",
    title: messages.tutorial.parentChildrenTitle,
    body: messages.tutorial.parentChildrenBody,
    pose: "explica",
  },
  {
    key: "crear",
    anchor: "parent-create",
    title: messages.tutorial.parentCreateTitle,
    body: messages.tutorial.parentCreateBody,
    pose: "senalaArriba",
  },
  {
    key: "final",
    title: messages.tutorial.parentDoneTitle,
    body: messages.tutorial.parentDoneBody,
    pose: "bienHecho",
  },
];

export const CHILD_STEPS: TutorialStep[] = [
  {
    key: "bienvenida",
    title: messages.tutorial.childWelcomeTitle,
    body: messages.tutorial.childWelcomeBody,
    pose: "saluda",
  },
  {
    key: "saldo",
    anchor: "child-balance",
    title: messages.tutorial.childBalanceTitle,
    body: messages.tutorial.childBalanceBody,
    pose: "presenta",
  },
  {
    key: "tareas",
    anchor: "child-tasks",
    title: messages.tutorial.childTasksTitle,
    body: messages.tutorial.childTasksBody,
    pose: "senalaAbajo",
  },
  {
    key: "premios",
    anchor: "child-rewards",
    title: messages.tutorial.childRewardsTitle,
    body: messages.tutorial.childRewardsBody,
    pose: "celebra",
  },
  {
    key: "final",
    title: messages.tutorial.childDoneTitle,
    body: messages.tutorial.childDoneBody,
    pose: "bienHecho",
  },
];
