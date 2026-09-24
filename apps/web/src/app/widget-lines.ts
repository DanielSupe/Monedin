import type { FamilyRole } from "@monedin/contracts";
import { POSES } from "../ui/mascot-poses.js";
import { messages } from "../lib/messages.js";

export type Area =
  | "home"
  | "tasks"
  | "rewards"
  | "redemptions"
  | "children"
  | "account"
  | "help";

export interface WidgetLine {
  text: string;

  image: string;
}

const PREFIJOS: Array<[string, Area]> = [
  ["/me/tasks", "tasks"],
  ["/me/rewards", "rewards"],
  ["/me/redemptions", "redemptions"],
  ["/me/settings", "account"],
  ["/me/coins", "account"],
  ["/tasks", "tasks"],
  ["/rewards", "rewards"],
  ["/redemptions", "redemptions"],
  ["/children", "children"],
  ["/account", "account"],
  ["/help", "help"],
  ["/assistant", "help"],
];

export function areaOf(pathname: string): Area {
  for (const [prefijo, area] of PREFIJOS) {
    if (pathname === prefijo || pathname.startsWith(`${prefijo}/`)) {
      return area;
    }
  }

  return "home";
}

export function offersAssistant(area: Area): boolean {
  return area !== "help";
}

const w = messages.widget;

export const LINES: Record<FamilyRole, Record<Area, WidgetLine[]>> = {
  CHILD: {
    home: [
      { text: w.childHomeBalance, image: POSES.miraElSaldo },
      { text: w.childHomeAsk, image: POSES.presenta },
      { text: w.childHomeCycle, image: POSES.idea },
    ],
    tasks: [
      { text: w.childTasksDo, image: POSES.corre },
      { text: w.childTasksApproval, image: POSES.explica },
    ],
    rewards: [
      { text: w.childRewardsChoose, image: POSES.elige },
      { text: w.childRewardsGoal, image: POSES.alcanzaLaMeta },
    ],
    redemptions: [
      { text: w.childRedemptionsWait, image: POSES.duda },
      { text: w.childRedemptionsWhy, image: POSES.explica },
    ],

    children: [{ text: w.childHomeAsk, image: POSES.presenta }],
    account: [
      { text: w.childAccountPin, image: POSES.idea },
      { text: w.childAccountAvatar, image: POSES.sorpresa },
    ],
    help: [{ text: w.childHelp, image: POSES.presenta }],
  },
  PARENT: {
    home: [
      { text: w.parentHomePending, image: POSES.explica },
      { text: w.parentHomeAsk, image: POSES.presenta },
    ],
    tasks: [
      { text: w.parentTasksApprove, image: POSES.idea },
      { text: w.parentTasksConflict, image: POSES.duda },
    ],
    rewards: [
      { text: w.parentRewardsPrice, image: POSES.elige },
      { text: w.parentRewardsRetire, image: POSES.explica },
    ],
    redemptions: [
      { text: w.parentRedemptionsFrozen, image: POSES.idea },
      { text: w.parentRedemptionsReject, image: POSES.duda },
    ],
    children: [
      { text: w.parentChildrenPin, image: POSES.explica },
      { text: w.parentChildrenBalance, image: POSES.miraElSaldo },
    ],
    account: [
      { text: w.parentAccountLeave, image: POSES.idea },
      { text: w.parentAccountAsk, image: POSES.presenta },
    ],
    help: [{ text: w.parentHelp, image: POSES.presenta }],
  },
};

export const WIDGET_ROTATION_MS = 8_000;
