import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, DataTable } from "../../src/ui/index.js";

/**
 * La pieza se monta SOLA: sin router, sin proveedores y sin servidor.
 *
 * Es lo que compra que reciba encabezados y celdas ya compuestas en vez de
 * saber qué es un canje. Aquí se le pasa un `Badge` en una celda y la pieza no
 * se entera de por qué ese tono.
 */
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

    // Por su NOMBRE y no solo por el rol: una tabla sin nombre obliga a quien la
    // escucha a deducir de qué es a partir de su primera celda.
    expect(screen.getByRole("table", { name: "Lo que he pedido" })).toBeInTheDocument();
  });

  /*
   * Lo que de verdad distingue una tabla de una rejilla de cajas: que cada valor
   * sepa de qué columna es. Se comprueba pidiendo las celdas POR su encabezado,
   * que es lo que falla si el `scope` se olvida — y olvidarlo no rompe nada
   * visible, que es justo por lo que esta pieza existe.
   */
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

    // Las de datos: la de encabezados también es una `row`.
    const filas = screen.getAllByRole("row").slice(1);
    expect(filas).toHaveLength(2);

    const celdas = within(filas[0] as HTMLElement).getAllByRole("cell");
    expect(celdas.map((celda) => celda.textContent)).toEqual(["Helado", "60", "Aprobado"]);
  });

  it("sin filas no dibuja una tabla con encabezados y nada debajo", () => {
    const { container } = render(
      <DataTable caption="Lo que he pedido" columns={COLUMNAS} rows={[]} />,
    );

    // Ni el hueco: una tabla vacía con sus encabezados dice «esto está roto»
    // donde el estado vacío del sistema dice «todavía no hay nada». Lo segundo
    // lo pone quien usa la pieza.
    expect(container).toBeEmptyDOMElement();
  });

  it("deja pasar cualquier contenido en una celda, sin saber qué es", () => {
    render(<DataTable caption="Lo que he pedido" columns={COLUMNAS} rows={FILAS} />);

    // El `Badge` llega entero a su celda. La pieza no lo interpreta.
    expect(screen.getByText("No esta vez")).toBeInTheDocument();
  });
});
