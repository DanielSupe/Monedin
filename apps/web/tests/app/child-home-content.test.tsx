import type { OwnReward, OwnTask } from "@monedin/contracts";
import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { avanceDeTareas, metaMasCercana, porEtapa } from "../../src/features/children/home-data.js";
import { comoNino, montarApp, pagina } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function tarea(id: string, title: string, status: OwnTask["status"], coins = 10): OwnTask {
  return {
    id,
    title,
    description: null,
    coins,
    dueDate: null,
    status,
    evidence: null,
    createdAt: "2026-09-01T10:00:00.000Z",
  };
}

function premio(id: string, title: string, coins: number, affordable: boolean): OwnReward {
  return {
    id,
    title,
    description: null,
    image: null,
    coins,
    affordable,
    createdAt: "2026-09-01T10:00:00.000Z",
  };
}

/** El saldo del actor de prueba, que es lo que la pantalla pinta en grande. */
const SALDO = 120;

async function montar(tareas: OwnTask[], premios: OwnReward[]): Promise<void> {
  await montarApp("/", comoNino(), [], {
    "/tasks/mine": pagina(tareas),
    "/rewards/mine": pagina(premios),
  });
}

/**
 * El requisito que este change CASI rompe, y por eso es el primero.
 *
 * «El saldo es lo principal del inicio del niño» está escrito desde
 * `redesign-child-home`, y las referencias visuales del rediseño lo movían a una
 * píldora en la cabecera. Al añadirle contenido a esta pantalla, lo que hay que
 * fijar no es que el saldo esté: es que SIGA siendo lo más grande.
 */
describe("el saldo sigue mandando en el inicio", () => {
  it("se pinta en la talla mayor, y ninguna otra cifra la usa", async () => {
    await montar([tarea("t1", "Tender la cama", "PENDING")], []);

    const saldo = await screen.findByText(String(SALDO));

    // La talla la lleva la pieza de cantidades, que es quien la declara.
    expect(saldo.closest(".text-hero")).not.toBeNull();

    // Y nada más de la pantalla compite en tamaño con él: si otra cosa usara la
    // talla mayor, el saldo dejaría de ser «lo primero que se lee».
    expect(document.querySelectorAll(".text-hero")).toHaveLength(1);
  });

  it("el marco no lo repite: el saldo vive aquí y en su historial", async () => {
    await montar([], []);

    // Una sola vez en la pantalla. Si el marco lo llevara, saldría dos.
    expect(await screen.findAllByText(String(SALDO))).toHaveLength(1);
  });
});

/**
 * Lo que la pantalla gana, y lo que NO dice.
 *
 * Era un número y cuatro destinos: un niño que entraba a ver qué le tocaba tenía
 * que dar un paso más para averiguarlo.
 */
describe("el inicio contesta «¿qué hago ahora?»", () => {
  it("enseña lo que le queda por hacer, y no lo que ya hizo", async () => {
    await montar(
      [
        tarea("t1", "Tender la cama", "PENDING"),
        tarea("t2", "Leer 15 minutos", "COMPLETED"),
        tarea("t3", "Sacar la basura", "APPROVED"),
      ],
      [],
    );

    expect(await screen.findByText("Tender la cama")).toBeInTheDocument();
    expect(screen.queryByText("Sacar la basura")).toBeNull();
  });

  it("sin nada pendiente lo dice, en vez de enseñar una lista vacía", async () => {
    await montar([tarea("t1", "Sacar la basura", "APPROVED")], []);

    expect(await screen.findByText(messages.children.homeAllDone)).toBeInTheDocument();
    expect(screen.queryByText(messages.children.homeTasksTitle)).toBeNull();
  });

  /*
   * «Hoy» no aparece en ninguna parte, y es una regla y no un detalle: una tarea
   * no tiene concepto de jornada, así que decirlo sería enseñar como dato algo
   * que el modelo no sabe.
   */
  it("no habla de «hoy» en ningún sitio", async () => {
    await montar([tarea("t1", "Tender la cama", "PENDING")], []);
    await screen.findByText("Tender la cama");

    expect(document.body.textContent?.toLowerCase()).not.toContain("hoy");
  });
});

/**
 * El aro y la meta se prueban aparte de la pantalla, con casos que DISTINGUEN.
 *
 * Es donde están los errores de verdad: el caso feliz de una lista se ve a ojo,
 * y un desempate que falla no.
 */
describe("lo que el inicio calcula", () => {
  it("el avance cuenta lo marcado como hecho, y da tres cifras distintas", () => {
    const cinco = [
      tarea("t1", "a", "PENDING"),
      tarea("t2", "b", "PENDING"),
      tarea("t3", "c", "PENDING"),
      tarea("t4", "d", "COMPLETED"),
      tarea("t5", "e", "APPROVED"),
    ];

    // 2 de 5: ni la mitad ni cero ni el total, así que un cálculo equivocado
    // —contar solo las aprobadas, o contar las pendientes— da otro número.
    expect(avanceDeTareas(cinco)).toEqual({ done: 2, total: 5 });
    expect(avanceDeTareas([])).toEqual({ done: 0, total: 0 });
    expect(avanceDeTareas(cinco.slice(3))).toEqual({ done: 2, total: 2 });
  });

  it("la meta es el más barato de los que NO alcanza", () => {
    const meta = metaMasCercana([
      premio("r1", "Barato y alcanzable", 50, true),
      premio("r2", "Caro", 300, false),
      premio("r3", "El más cerca", 150, false),
    ]);

    expect(meta?.title).toBe("El más cerca");
  });

  /*
   * El desempate, que es lo que impide que el panel cambie de premio entre dos
   * recargas sin que haya pasado nada. Se comprueba con las dos ÓRDENES de
   * entrada: sin desempate, cada una devolvería un premio distinto.
   */
  it("con dos al mismo precio, el desempate es estable", () => {
    const a = premio("r-a", "Uno", 200, false);
    const b = premio("r-b", "Otro", 200, false);

    expect(metaMasCercana([a, b])?.id).toBe(metaMasCercana([b, a])?.id);
  });

  it("sin ninguno fuera de alcance no hay meta", () => {
    expect(metaMasCercana([premio("r1", "Alcanzable", 50, true)])).toBeNull();
    expect(metaMasCercana([])).toBeNull();
  });
});

/**
 * Los dos casos sin meta son CONTRARIOS y se leen distinto.
 *
 * Que le alcancen todos se celebra; no tener ninguno ofrecido no se dibuja.
 * Tratarlos igual diría que no hay nada que conseguir cuando lo que pasa es lo
 * opuesto.
 */
describe("la meta y sus dos ausencias", () => {
  it("con una meta pendiente, la enseña con lo que le falta", async () => {
    await montar([], [premio("r1", "Noche de pelis", 300, false)]);

    expect(await screen.findByText(messages.rewards.nextRewardTitle)).toBeInTheDocument();
    expect(screen.getByText("Noche de pelis")).toBeInTheDocument();
  });

  it("si le alcanzan todos, lo celebra", async () => {
    await montar([], [premio("r1", "Helado", 50, true)]);

    expect(await screen.findByText(messages.rewards.allAffordableTitle)).toBeInTheDocument();
    expect(screen.queryByText(messages.rewards.nextRewardTitle)).toBeNull();
  });

  it("sin premios ofrecidos no enseña ninguna de las dos cosas", async () => {
    await montar([tarea("t1", "Tender la cama", "PENDING")], []);
    await screen.findByText("Tender la cama");

    expect(screen.queryByText(messages.rewards.nextRewardTitle)).toBeNull();
    expect(screen.queryByText(messages.rewards.allAffordableTitle)).toBeNull();
  });
});

/**
 * El agrupado por etapa, con un caso que DISTINGUE.
 *
 * Las cantidades son 2, 1 y 2 a propósito: con 1, 1 y 1 un error de agrupación
 * —mezclar dos etapas, o contar el total en cada grupo— daría el mismo número
 * en los tres y pasaría en verde. Es el error que ya se pagó una vez contando
 * tareas por aprobar en el panel del padre.
 */
describe("las tareas se agrupan por su etapa del ciclo", () => {
  const CINCO = [
    tarea("t1", "Tender la cama", "PENDING"),
    tarea("t2", "Leer 15 minutos", "PENDING"),
    tarea("t3", "Poner la mesa", "COMPLETED"),
    tarea("t4", "Sacar la basura", "APPROVED"),
    tarea("t5", "Guardar los juguetes", "APPROVED"),
  ];

  it("en el orden del ciclo, y cada grupo con lo suyo", () => {
    const grupos = porEtapa(CINCO);

    expect(grupos.map((g) => g.etapa)).toEqual(["PENDING", "COMPLETED", "APPROVED"]);
    expect(grupos.map((g) => g.tasks.length)).toEqual([2, 1, 2]);
  });

  it("un grupo vacío no se devuelve, ni siquiera con cero", () => {
    const soloHechas = porEtapa([tarea("t1", "Sacar la basura", "APPROVED")]);

    expect(soloHechas).toHaveLength(1);
    expect(soloHechas[0]?.etapa).toBe("APPROVED");
  });

  /*
   * El orden NO depende del volumen. Con una etapa que acumula la mayoría, una
   * ordenación por cantidad la pondría primera — y la pantalla cambiaría de
   * forma cada día, que es justo lo que se aprende de una pantalla.
   */
  it("el orden no cambia aunque una etapa acumule casi todo", () => {
    const desequilibrada = [
      tarea("t1", "a", "APPROVED"),
      tarea("t2", "b", "APPROVED"),
      tarea("t3", "c", "APPROVED"),
      tarea("t4", "d", "PENDING"),
    ];

    expect(porEtapa(desequilibrada).map((g) => g.etapa)).toEqual(["PENDING", "APPROVED"]);
  });
});

/**
 * El escaparate destaca su meta en la TESELA, no en un panel.
 *
 * Un panel encima repetiría el título de un premio que la rejilla ya enseña. Lo
 * que hacía falta era contestar «¿a cuál llego antes?» sin comparar seis barras,
 * y para eso basta con marcar cuál es.
 */
describe("el escaparate marca a cuál llega antes", () => {
  it("solo una tesela lleva la marca, y es la del más barato que no alcanza", async () => {
    await montarApp("/me/rewards", comoNino(), [], {
      "/rewards/mine": pagina([
        premio("r1", "Caro", 300, false),
        premio("r2", "El más cerca", 150, false),
        premio("r3", "Ya alcanzable", 50, true),
      ]),
    });

    const marcadas = await screen.findAllByText(messages.rewards.nextRewardTitle);
    expect(marcadas).toHaveLength(1);
    expect(marcadas[0]?.closest("li")?.textContent).toContain("El más cerca");
  });

  it("si le alcanzan todos, ninguna tesela se marca como meta", async () => {
    await montarApp("/me/rewards", comoNino(), [], {
      "/rewards/mine": pagina([premio("r1", "Helado", 50, true)]),
    });

    expect(await screen.findByText("Helado")).toBeInTheDocument();
    expect(screen.queryByText(messages.rewards.nextRewardTitle)).toBeNull();
  });
});
