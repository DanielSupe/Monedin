import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, DataTable } from "../../src/ui/index.js";

const COLUMNAS = [
  { key: "que", header: "Premio" },
  { key: "cuanto", header: "Monedas", align: "end" as const },
  { key: "estado", header: "Estado" },
];

const FILAS = [
  {
    key: "1",
    cells: { que: "Helado", cuanto: "60", estado: <Badge tone="success">Aprobado</Badge> },
  },
  {
    key: "2",
    cells: { que: "Patines", cuanto: "350", estado: <Badge tone="warning">No esta vez</Badge> },
  },
];

describe("las filas de datos", () => {
  it("se anuncian como una tabla, y con nombre", () => {
    render(<DataTable caption="Lo que he pedido" columns={COLUMNAS} rows={FILAS} />);

    expect(screen.getByRole("table", { name: "Lo que he pedido" })).toBeInTheDocument();
  });

  it("asocia cada valor con el encabezado de su columna", () => {
    render(<DataTable caption="Lo que he pedido" columns={COLUMNAS} rows={FILAS} />);

    for (const columna of COLUMNAS) {
      expect(screen.getByRole("columnheader", { name: columna.header })).toHaveAttribute(
        "scope",
        "col",
      );
    }
  });

  it("dibuja una fila por cada dato, con sus celdas en orden", () => {
    render(<DataTable caption="Lo que he pedido" columns={COLUMNAS} rows={FILAS} />);

    const filas = screen.getAllByRole("row").slice(1);
    expect(filas).toHaveLength(2);

    const celdas = within(filas[0] as HTMLElement).getAllByRole("cell");
    expect(celdas.map((celda) => celda.textContent)).toEqual(["Helado", "60", "Aprobado"]);
  });

  it("sin filas no dibuja una tabla con encabezados y nada debajo", () => {
    const { container } = render(
      <DataTable caption="Lo que he pedido" columns={COLUMNAS} rows={[]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("deja pasar cualquier contenido en una celda, sin saber qué es", () => {
    render(<DataTable caption="Lo que he pedido" columns={COLUMNAS} rows={FILAS} />);

    expect(screen.getByText("No esta vez")).toBeInTheDocument();
  });
});
