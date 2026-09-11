import type { OwnReward } from "@monedin/contracts";
import { messages } from "../../lib/messages.js";
import { HeroPanel, Mascota, ProgressBar } from "../../ui/index.js";
import { metaMasCercana } from "../children/home-data.js";

export interface GoalPanelProps {
  rewards: OwnReward[];
  /** El saldo, para medir cuánto falta. Sale de la sesión, no de cada premio. */
  balance: number;
}

/**
 * La meta más cercana: el premio más barato de los que todavía no alcanza.
 *
 * Cada premio ya dice cuánto le falta, pero ninguno dice cuál está MÁS CERCA, y
 * esa es la pregunta que convierte un saldo en una decisión de ahorro: no
 * «cuánto tengo» sino «qué consigo antes».
 *
 * Es una pieza y no un bloque copiado porque sale en DOS pantallas —el inicio y
 * el escaparate—. Escrita dos veces, las dos acabarían diciendo lo mismo de dos
 * maneras, que es como empezó el problema que este rediseño arregla.
 *
 * LOS DOS CASOS SIN META SON CONTRARIOS y se leen distinto:
 *
 * - Le alcanzan TODOS: no hay nada que perseguir, y se celebra.
 * - No tiene NINGÚN premio ofrecido: no hay nada que enseñar, y no se dibuja.
 *
 * Tratarlos igual diría que no hay nada que conseguir cuando lo que pasa es lo
 * contrario.
 */
export function GoalPanel({ rewards, balance }: GoalPanelProps): React.ReactElement | null {
  if (rewards.length === 0) return null;

  const meta = metaMasCercana(rewards);

  if (meta === null) {
    return (
      <HeroPanel tone="saving" mascot={<Mascota pose="celebra" size="medium" />}>
        <p className="text-title font-extrabold text-ink-inverted">
          {messages.rewards.allAffordableTitle}
        </p>
        <p className="text-body text-ink-inverted opacity-90">
          {messages.rewards.allAffordableBody}
        </p>
      </HeroPanel>
    );
  }

  return (
    <HeroPanel tone="saving" mascot={<Mascota pose="elige" size="medium" />}>
      <p className="text-micro font-extrabold uppercase text-ink-inverted opacity-80">
        {messages.rewards.nextRewardTitle}
      </p>
      <p className="text-title font-extrabold text-ink-inverted">{meta.title}</p>
      {/*
        La barra dice «estás por aquí» y su cifra cuánto exactamente. Las dos, y
        no una: sin la cifra, una barra al 80% de un premio de 300 no dice si
        faltan 60 monedas o seis.
      */}
      <ProgressBar value={balance} max={meta.coins} label={meta.title} />
    </HeroPanel>
  );
}
