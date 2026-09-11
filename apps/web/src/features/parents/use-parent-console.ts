import { MAX_PAGE_SIZE, type Child } from "@monedin/contracts";
import { useChildren } from "../children/use-children.js";
import { useRedemptions } from "../redemptions/use-redemptions.js";
import { useTaskBatches } from "../tasks/use-tasks.js";

/**
 * Las cifras del panel del padre.
 *
 * Se apoya en los mismos hooks —y por tanto en las mismas claves de consulta—
 * que usan los listados. No es ahorro: es que aprobar una tarea o resolver un
 * canje ya invalida esas claves, así que el panel se actualiza solo y sin
 * código nuevo, y la primera navegación a una bandeja encuentra su página en
 * la caché.
 */

/**
 * Una cifra que puede no ser exacta.
 *
 * `exact: false` significa «al menos esto»: se enseña con un `+`. Un número
 * que dice 100 cuando son 130 no se nota nunca, y el error crece justo con las
 * familias que más lo necesitan.
 */
export type Recuento = { value: number; exact: boolean };

export type ParentConsole = {
  tasksToApprove: Recuento;
  redemptionsWaiting: Recuento;
  children: Child[];
  isPending: boolean;
  error: unknown;
};

/**
 * Las DOS cifras de bandeja, sin lo demás.
 *
 * Existe porque el lateral las necesita y no necesita a los hijos: pedirle al
 * marco el panel entero traería una consulta más en cada pantalla del padre.
 *
 * Y existe COMO HOOK COMPARTIDO, no como una segunda cuenta: el panel llama a
 * este mismo, así que la cifra de la insignia y la del aviso no pueden
 * separarse. Dos cuentas del mismo número son dos que acaban discrepando — que
 * es justo el error que el comentario de las TAREAS existe para evitar.
 */
export function usePendingCounts(): {
  tasksToApprove: Recuento;
  redemptionsWaiting: Recuento;
  isPending: boolean;
  error: unknown;
} {
  /*
   * TAREAS: hay que traerlas para contarlas, y las dos cuentas obvias fallan.
   *
   * El listado del padre pagina por REPARTO y, al filtrar por estado, devuelve
   * el reparto ENTERO —el padre quiere ver el grupo completo aunque solo una
   * de sus tareas esté para aprobar, decisión 5 del design de `add-tasks`—.
   * De ahí salen dos números equivocados, en direcciones opuestas:
   *
   *   reparto «Recoger la mesa» → Ana (COMPLETED), Luis (COMPLETED), Sara (PENDING)
   *
   *     data.total                  → 1   hay DOS niños esperando
   *     items.flatMap(b => b.tasks) → 3   Sara no ha hecho nada todavía
   *     filas con status COMPLETED  → 2   ✓
   *
   * Se pide la página más grande que el contrato admite y se cuenta la
   * tercera.
   */
  const tareas = useTaskBatches({ page: 1, pageSize: MAX_PAGE_SIZE, status: "COMPLETED" });

  /*
   * CANJES: aquí `total` SÍ es la cifra buscada, porque esta lista pagina por
   * fila. Por eso se pide con `pageSize: 1` y no se trae ni un canje.
   *
   * Dos cuentas del mismo panel obtenidas de dos maneras distintas parece una
   * incoherencia y no lo es: las dos listas tienen unidades distintas porque
   * sus pantallas las tienen. Unificarlas exigiría que una de las dos mintiera.
   */
  const canjes = useRedemptions({ page: 1, pageSize: 1, status: "PENDING" });

  const filasCompletadas = (tareas.data?.items ?? []).reduce(
    (suma, reparto) =>
      suma + reparto.tasks.filter((tarea) => tarea.status === "COMPLETED").length,
    0,
  );

  return {
    tasksToApprove: {
      value: filasCompletadas,
      // Si quedaron repartos fuera de la página, lo contado es un mínimo.
      exact: (tareas.data?.totalPages ?? 1) <= 1,
    },
    redemptionsWaiting: { value: canjes.data?.total ?? 0, exact: true },
    isPending: tareas.isPending || canjes.isPending,
    /*
     * El fallo VIAJA con las cifras, y no se queda aquí. Sin esto, una bandeja
     * que no responde da cero y el panel dice «todo al día» — la peor respuesta
     * posible a un fallo, porque afirma lo contrario de lo que pasa.
     */
    error: tareas.error ?? canjes.error,
  };
}

export function useParentConsole(): ParentConsole {
  const bandejas = usePendingCounts();

  /*
   * HIJOS: una sola página los trae a todos, y eso depende de que
   * `MAX_CHILDREN_PER_FAMILY` (10) quepa en `DEFAULT_PAGE_SIZE` (20). Es una
   * relación entre dos constantes que nadie escribió a propósito y que se
   * rompería en silencio, así que hay un test que la compara.
   */
  const hijos = useChildren(1);

  return {
    ...bandejas,
    children: hijos.data?.items ?? [],
    isPending: bandejas.isPending || hijos.isPending,
    error: bandejas.error ?? hijos.error,
  };
}
