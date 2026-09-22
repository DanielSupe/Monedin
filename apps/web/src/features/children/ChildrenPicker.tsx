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
  /** El del grupo de modos. Decide CUÁNTO, así que no puede llevar el del conjunto. */
  valueLegend: string;
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
            {/*
              SOBRE `Checkbox`, y lo que se gana es el área tocable: la etiqueta
              envuelve al control, así que se marca pulsando la fila entera y no
              un cuadrado de 20px. En una tablet que un padre usa con el pulgar,
              esa es la diferencia entre acertar a la primera o a la tercera.
            */}
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

      {/*
        EL GRUPO DE MODOS VA DESPUÉS DE LOS HIJOS, y estaba antes.

        Con el orden de antes, su pregunta —«¿cuánto vale?»— quedaba pegada a la
        del conjunto —«¿para quién?»—, dos renglones seguidos preguntando cosas
        distintas y leyéndose como un solo encabezado partido. Es lo que se ve al
        abrir la pantalla y lo que la maqueta pone al revés.

        Y el orden dice algo: primero a quién, después cuánto. Elegir el modo de
        valor antes de saber cuántos hijos van es decidir sobre un conjunto que
        todavía no existe.
      */}
      {/*
        Los dos modos, solo cuando hay dos. Reasignar precios en el catálogo es
        siempre uno por hijo, y ofrecer ahí «el mismo para todos» sería ofrecer
        algo que no significa nada.

        SOBRE `RadioGroup`, que es lo que trae lo difícil: las flechas mueven la
        selección dentro del grupo, el tabulador entra y sale del grupo ENTERO y
        no opción por opción, y el grupo se anuncia con su nombre antes de leer
        las opciones. A mano eran dos `<input type="radio">` con un `name`
        compartido, que acierta el grupo y no el resto.
      */}
      {mode === "both" && (
        <RadioGroup
          /*
            SU PROPIO NOMBRE, y antes llevaba el del conjunto entero.

            Este grupo decide CUÁNTO —el mismo para todos o uno por hijo— y se
            anunciaba como «¿Para quién?», que es de lo que no va. Quien lo
            recorre con un lector de pantalla oía la pregunta equivocada justo
            antes de sus dos opciones.
          */
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
        /*
          LA AYUDA DICE A CUÁNTOS, que es la duda de quien reparte: si esos ocho
          son ocho en total o ocho para cada uno. La cifra sola no lo dice, y la
          respuesta —cada uno— es la que cuesta dinero si se entiende al revés.

          Se compone en vivo con el valor que se está escribiendo, y con `contar`
          para que un valor de uno no diga «1 monedas».
        */
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

/** Lo que falta cuando `build()` devuelve `null`. Uno solo, y es siempre el mismo. */
export const PICKER_MISSING = messages.children.pickAtLeastOne;
