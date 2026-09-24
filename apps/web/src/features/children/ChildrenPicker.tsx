import {
  COINS_MAX,
  COINS_MIN,
  MAX_CHILDREN_PER_FAMILY,
} from "@monedin/contracts";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import {
  Avatar,
  Checkbox,
  Field,
  Input,
  RadioGroup,
  Skeleton,
} from "../../ui/index.js";
import { contar } from "../../lib/plural.js";
import { useChildren } from "./use-children.js";

export type ChildrenSelection =
  | { childIds: string[]; coins: number }
  | { assignments: Array<{ childId: string; coins: number }> };

export interface PickerLabels {
  legend: string;

  valueLegend: string;
  sameCoins: string;
  coinsPerChild: string;
  coins: string;
}

export function useChildrenPicker({
  mode = "both",
  defaultCoins = "10",
  initial = {},
}: {
  mode?: "both" | "perChild";
  defaultCoins?: string;

  initial?: Record<string, string>;
} = {}) {
  const yaHabia = Object.keys(initial);

  const [elegidos, setElegidos] = useState<string[]>(yaHabia);
  const [mismoValor, setMismoValor] = useState(mode === "both");
  const [coins, setCoins] = useState(defaultCoins);
  const [porHijo, setPorHijo] = useState<Record<string, string>>(initial);

  const { data, isPending } = useChildren(1, MAX_CHILDREN_PER_FAMILY);

  function alternar(childId: string): void {
    setElegidos((previos) =>
      previos.includes(childId)
        ? previos.filter((uno) => uno !== childId)
        : [...previos, childId],
    );
  }

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
  const { hijos, isPending, elegidos, mismoValor, coins, porHijo, mode } =
    picker;

  if (isPending) {
    return <Skeleton lines={3} />;
  }

  const porCadaUno = mode === "perChild" || !mismoValor;

  return (
    <fieldset className="flex min-w-0 flex-col gap-3 border-0 p-0">
      <legend className="text-body font-bold">{labels.legend}</legend>

      <ul className="flex list-none flex-col gap-2 p-0">
        {hijos.map((hijo) => (
          <li
            key={hijo.id}
            className="flex min-w-0 flex-wrap items-center gap-3"
          >

            <Checkbox
              className="min-w-0 flex-1"
              checked={elegidos.includes(hijo.id)}
              onCheckedChange={() => picker.alternar(hijo.id)}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Avatar value={hijo.avatar} size="small" />
                <span className="truncate">{hijo.name}</span>
              </span>
            </Checkbox>

            {porCadaUno && elegidos.includes(hijo.id) && (
              <Input
                type="number"
                min={COINS_MIN}
                max={COINS_MAX}
                value={porHijo[hijo.id] ?? ""}
                onChange={(evento) =>
                  picker.setPorHijo((previos) => ({
                    ...previos,
                    [hijo.id]: evento.target.value,
                  }))
                }
                className="w-28"
                aria-label={`${labels.coins} · ${hijo.name}`}
              />
            )}
          </li>
        ))}
      </ul>

      {mode === "both" && (
        <RadioGroup

          label={labels.valueLegend}
          value={mismoValor ? "same" : "perChild"}
          onValueChange={(valor) => picker.setMismoValor(valor === "same")}
          options={[
            { value: "same", label: labels.sameCoins },
            { value: "perChild", label: labels.coinsPerChild },
          ]}
        />
      )}

      {!porCadaUno && (
        <Field
          label={labels.coins}
          help={`${contar(Number(coins), messages.ui.coinsUnitSingular, messages.ui.coinsUnit)} ${
            messages.children.coinsEachChosen
          }`}
        >
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

export const PICKER_MISSING = messages.children.pickAtLeastOne;
