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

const SALDO = 120;

async function montar(tareas: OwnTask[], premios: OwnReward[]): Promise<void> {
  await montarApp("/", comoNino(), [], {
    "/tasks/mine": pagina(tareas),
    "/rewards/mine": pagina(premios),
  });
}

describe("el saldo sigue siendo el camino a su historial", () => {
  it("se toca y lleva a de dónde salieron", async () => {
    await montar([tarea("t1", "Tender la cama", "PENDING")], []);

    const saldo = await screen.findByText(String(SALDO));
    const enlace = saldo.closest("a");

    expect(enlace, "el saldo dejó de ser un enlace").not.toBeNull();
    expect(enlace).toHaveAttribute("href", expect.stringContaining("/me/coins"));
  });

  it("se anuncia con su unidad y no como un número suelto", async () => {
    await montar([], []);

    expect(
      await screen.findByLabelText(`${SALDO} ${messages.ui.coinsUnit}`),
    ).toBeInTheDocument();
  });

  it("el marco no lo repite: el saldo vive aquí y en su historial", async () => {
    await montar([], []);

    expect(await screen.findAllByText(String(SALDO))).toHaveLength(1);
  });
});

describe("el inicio contesta «¿qué hago ahora?»", () => {
  it("enseña las tres etapas, y lo que se puede hacer ahora va primero", async () => {
    await montar(
      [
        tarea("t3", "Sacar la basura", "APPROVED"),
        tarea("t2", "Leer 15 minutos", "COMPLETED"),
        tarea("t1", "Tender la cama", "PENDING"),
      ],
      [],
    );

    const pendiente = await screen.findByText("Tender la cama");
    const marcada = screen.getByText("Leer 15 minutos");
    const aprobada = screen.getByText("Sacar la basura");

    expect(pendiente.compareDocumentPosition(marcada)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(marcada.compareDocumentPosition(aprobada)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("sin nada pendiente lo dice, y aun así enseña lo que hizo", async () => {
    await montar([tarea("t1", "Sacar la basura", "APPROVED")], []);

    expect(await screen.findByText(messages.children.homeAllDone)).toBeInTheDocument();
    expect(screen.getByText("Sacar la basura")).toBeInTheDocument();
  });

  it("no habla de «hoy» en ningún sitio", async () => {
    await montar([tarea("t1", "Tender la cama", "PENDING")], []);
    await screen.findByText("Tender la cama");

    expect(document.body.textContent?.toLowerCase()).not.toContain("hoy");
  });
});

describe("lo que el inicio calcula", () => {
  it("el avance cuenta lo marcado como hecho, y da tres cifras distintas", () => {
    const cinco = [
      tarea("t1", "a", "PENDING"),
      tarea("t2", "b", "PENDING"),
      tarea("t3", "c", "PENDING"),
      tarea("t4", "d", "COMPLETED"),
      tarea("t5", "e", "APPROVED"),
    ];

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
