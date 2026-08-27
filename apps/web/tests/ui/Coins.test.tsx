import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { Coins } from "../../src/ui/Coins.js";
import { ProgressBar } from "../../src/ui/ProgressBar.js";

describe("Coins", () => {
  it("anuncia la unidad, que se ve como glifo pero no se lee", () => {
    render(<Coins amount={25} />);

    expect(screen.getByLabelText(`25 ${messages.ui.coinsUnit}`)).toBeInTheDocument();
  });

  it("usa el singular con una sola moneda", () => {
    render(<Coins amount={1} />);

    expect(screen.getByLabelText(`1 ${messages.ui.coinsUnitSingular}`)).toBeInTheDocument();
  });

  it("formatea con las convenciones del producto y no con las del navegador", () => {
    render(<Coins amount={1250} />);

    const esperado = new Intl.NumberFormat(messages.app.locale).format(1250);
    expect(screen.getByLabelText(`${esperado} ${messages.ui.coinsUnit}`)).toBeInTheDocument();
  });

  it("el cero es una cantidad válida y se anuncia en plural", () => {
    render(<Coins amount={0} />);

    expect(screen.getByLabelText(`0 ${messages.ui.coinsUnit}`)).toBeInTheDocument();
  });
});

describe("ProgressBar", () => {
  it("expone su valor y su tope", () => {
    render(<ProgressBar value={70} max={200} label="Para el cine" />);

    const barra = screen.getByRole("progressbar", { name: "Para el cine" });
    expect(barra).toHaveAttribute("aria-valuenow", "70");
    expect(barra).toHaveAttribute("aria-valuemax", "200");
  });

  it("recorta un valor por encima del tope en vez de salirse de su caja", () => {
    render(<ProgressBar value={500} max={200} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "200");
  });

  it("recorta un valor negativo a cero", () => {
    render(<ProgressBar value={-10} max={200} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("un tope de cero no divide por cero", () => {
    render(<ProgressBar value={0} max={0} />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("sin etiqueta propia usa la genérica del catálogo", () => {
    render(<ProgressBar value={1} max={2} />);

    expect(screen.getByRole("progressbar", { name: messages.ui.progressLabel })).toBeInTheDocument();
  });
});
