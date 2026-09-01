import { COINS_MAX, COINS_MIN, MAX_CHILDREN_PER_FAMILY } from "@monedin/contracts";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { Avatar, Field, Input, Skeleton } from "../../ui/index.js";
import { useChildren } from "./use-children.js";

/**
 * A quién y por cuánto.
 *
 * Repartir una tarea y publicar un premio piden exactamente lo mismo —a qué
 * hijos y cuántas monedas a cada uno— y hasta `redesign-parent-authoring` estaba
 * escrito TRES veces: entero en las dos altas, casi línea por línea, y una
 * tercera vez dentro del catálogo para reasignar precios. Tres copias de la
 * misma decisión de negocio es cómo una acaba comportándose distinto sin que
 * nadie lo note.
 *
 * Vive en `features/children/` y no en `ui/`: sabe qué es un hijo, pide la lista
 * y conoce los dos modos del precio. Una pieza del sistema no sabe de dominio, y
 * esto es dominio puro.
 *
 * Los TEXTOS entran por prop porque no son los mismos: para una tarea las
 * monedas son un valor y para un premio un precio, y esa diferencia es del
 * producto, no de la pieza.
 */

/** Lo que el contrato espera, ya en su forma final. */
export type ChildrenSelection =
  | { childIds: string[]; coins: number }
  | { assignments: Array<{ childId: string; coins: number }> };

export interface PickerLabels {
  legend: string;
  sameCoins: string;
  coinsPerChild: string;
  coins: string;
}

/**
 * El estado de la selección.
 *
 * `mode` decide si se ofrece elegir entre los dos modos o si es siempre uno por
 * hijo. Entra por parámetro y NO se adivina: el catálogo reasigna precios y ahí
 * «el mismo para todos» no significa nada.
 */
export function useChildrenPicker({
  mode = "both",
  defaultCoins = "10",
  initial = {},
}: {
  mode?: "both" | "perChild";
  defaultCoins?: string;
  /** Precios ya asignados, para editar en vez de empezar de cero. */
  initial?: Record<string, string>;
} = {}) {
  const yaHabia = Object.keys(initial);

  const [elegidos, setElegidos] = useState<string[]>(yaHabia);
  const [mismoValor, setMismoValor] = useState(mode === "both");
  const [coins, setCoins] = useState(defaultCoins);
  const [porHijo, setPorHijo] = useState<Record<string, string>>(initial);

  // Todos los hijos caben en una página: el tope por familia es menor que el
  // tamaño de página, y hay un test que compara esas dos constantes.
  const { data, isPending } = useChildren(1, MAX_CHILDREN_PER_FAMILY);

  function alternar(childId: string): void {
    setElegidos((previos) =>
      previos.includes(childId)
        ? previos.filter((uno) => uno !== childId)
        : [...previos, childId],
    );
  }

  /**
   * La selección en la forma del contrato, o `null` si está incompleta.
   *
   * Devolver `null` y no una forma a medias es lo que permite a quien la usa
   * decir QUÉ falta antes de rechazar, en vez de mandar algo inválido y dejar
   * que lo explique el servidor.
   */
  function build(): ChildrenSelection | null {
    if (elegidos.length === 0) {
      return null;
    }

    if (mode === "both" && mismoValor) {
      return { childIds: elegidos, coins: Number(coins) };
    }

    return {
      assignments: elegidos.map((childId) => ({
        childId,
        coins: Number(porHijo[childId] ?? ""),
      })),
    };
  }

  return {
    hijos: data?.items ?? [],
    isPending,
    elegidos,
    mismoValor,
    coins,
    porHijo,
    mode,
    alternar,
    setMismoValor,
    setCoins,
    setPorHijo,
    build,
  };
}

export type Picker = ReturnType<typeof useChildrenPicker>;

export function ChildrenPicker({
  picker,
  labels,
}: {
  picker: Picker;
  labels: PickerLabels;
}): React.ReactElement {
  const { hijos, isPending, elegidos, mismoValor, coins, porHijo, mode } = picker;

  if (isPending) {
    return <Skeleton lines={3} />;
  }

  const porCadaUno = mode === "perChild" || !mismoValor;

  return (
    <fieldset className="flex min-w-0 flex-col gap-3 border-0 p-0">
      <legend className="text-body font-bold">{labels.legend}</legend>

      {/*
        Los dos modos, solo cuando hay dos. Reasignar precios en el catálogo es
        siempre uno por hijo, y ofrecer ahí «el mismo para todos» sería ofrecer
        algo que no significa nada.

        Con `name` compartido, que es lo que convierte dos radios sueltos en un
        grupo por el que se navega con las flechas.
      */}
      {mode === "both" && (
        <div className="flex flex-wrap gap-4">
          <label className="text-body flex items-center gap-2">
            <input
              type="radio"
              name="coins-mode"
              checked={mismoValor}
              onChange={() => picker.setMismoValor(true)}
            />
            {labels.sameCoins}
          </label>
          <label className="text-body flex items-center gap-2">
            <input
              type="radio"
              name="coins-mode"
              checked={!mismoValor}
              onChange={() => picker.setMismoValor(false)}
            />
            {labels.coinsPerChild}
          </label>
        </div>
      )}

      <ul className="flex list-none flex-col gap-2 p-0">
        {hijos.map((hijo) => (
          <li key={hijo.id} className="flex min-w-0 flex-wrap items-center gap-3">
            <label className="text-body flex min-w-0 flex-1 items-center gap-3">
              <input
                type="checkbox"
                checked={elegidos.includes(hijo.id)}
                onChange={() => picker.alternar(hijo.id)}
              />
              <Avatar value={hijo.avatar} size="small" />
              <span className="truncate font-semibold">{hijo.name}</span>
            </label>

            {porCadaUno && elegidos.includes(hijo.id) && (
              <Input
                type="number"
                min={COINS_MIN}
                max={COINS_MAX}
                value={porHijo[hijo.id] ?? ""}
                onChange={(evento) =>
                  picker.setPorHijo((previos) => ({ ...previos, [hijo.id]: evento.target.value }))
                }
                className="w-28"
                aria-label={`${labels.coins} · ${hijo.name}`}
              />
            )}
          </li>
        ))}
      </ul>

      {!porCadaUno && (
        <Field label={labels.coins}>
          <Input
            type="number"
            min={COINS_MIN}
            max={COINS_MAX}
            value={coins}
            onChange={(evento) => picker.setCoins(evento.target.value)}
            className="w-32"
          />
        </Field>
      )}
    </fieldset>
  );
}

/** Lo que falta cuando `build()` devuelve `null`. Uno solo, y es siempre el mismo. */
export const PICKER_MISSING = messages.children.pickAtLeastOne;
