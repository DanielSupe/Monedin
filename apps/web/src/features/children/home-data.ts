import type { OwnReward, OwnTask } from "@monedin/contracts";

export interface Avance {
  done: number;
  total: number;
}

export function avanceDeTareas(tasks: OwnTask[]): Avance {
  return {
    done: tasks.filter((task) => task.status !== "PENDING").length,
    total: tasks.length,
  };
}

export function metaMasCercana(rewards: OwnReward[]): OwnReward | null {
  const fuera = rewards.filter((reward) => !reward.affordable);

  return (
    fuera.reduce<OwnReward | null>((mejor, reward) => {
      if (mejor === null) return reward;
      if (reward.coins !== mejor.coins) return reward.coins < mejor.coins ? reward : mejor;
      return reward.id < mejor.id ? reward : mejor;
    }, null) ?? null
  );
}

export const ETAPAS = ["PENDING", "COMPLETED", "APPROVED"] as const;

export type Etapa = (typeof ETAPAS)[number];

export interface Grupo {
  etapa: Etapa;
  tasks: OwnTask[];
}

export function porEtapa(tasks: OwnTask[]): Grupo[] {
  return ETAPAS.map((etapa) => ({
    etapa,
    tasks: tasks.filter((task) => task.status === etapa),
  })).filter((grupo) => grupo.tasks.length > 0);
}
