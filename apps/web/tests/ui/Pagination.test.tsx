import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { Pagination } from "../../src/ui/index.js";

const ANTERIOR = <a href="#anterior">{messages.ui.previousPage}</a>;
const SIGUIENTE = <a href="#siguiente">{messages.ui.nextPage}</a>;

describe("la paginación", () => {
  it("no se dibuja con una sola página", () => {
    const { container } = render(<Pagination page={1} totalPages={1} next={SIGUIENTE} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("enseña la posición dentro del total", () => {
    render(<Pagination page={3} totalPages={7} previous={ANTERIOR} next={SIGUIENTE} />);

    expect(screen.getByText("3 / 7")).toBeInTheDocument();
  });

  it("en la primera página no ofrece ir atrás", () => {
    render(<Pagination page={1} totalPages={4} next={SIGUIENTE} />);

    expect(screen.queryByText(messages.ui.previousPage)).toBeNull();
    expect(screen.getByText(messages.ui.nextPage)).toBeInTheDocument();
  });

  it("en la última no ofrece ir adelante", () => {
    render(<Pagination page={4} totalPages={4} previous={ANTERIOR} />);

    expect(screen.getByText(messages.ui.previousPage)).toBeInTheDocument();
    expect(screen.queryByText(messages.ui.nextPage)).toBeNull();
  });

  it("se anuncia como navegación", () => {
    render(<Pagination page={2} totalPages={4} previous={ANTERIOR} next={SIGUIENTE} />);

    expect(
      screen.getByRole("navigation", { name: messages.ui.paginationLabel }),
    ).toBeInTheDocument();
  });
});
