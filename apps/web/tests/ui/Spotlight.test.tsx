import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Spotlight } from "../../src/ui/index.js";

/**
 * La pieza se monta SOLA: sin router, sin proveedores y sin servidor.
 *
 * Eso es lo que compra que reciba dónde destacar y qué decir en vez de saber
 * qué es un perfil. Una pieza que consultara el actor necesitaría montar la
 * aplicación entera para probar que sin nada que destacar centra su panel.
 */
const RECUADRO = { top: 100, left: 40, width: 240, height: 120 };

function montar(props: Partial<Parameters<typeof Spotlight>[0]> = {}) {
  const onOpenChange = vi.fn();

  render(
    <Spotlight
      open
      onOpenChange={onOpenChange}
      title="Aquí ves lo que te espera"
      description="Lo que tus hijos marcaron y no has aprobado."
      footer={<button type="button">Seguir</button>}
      {...props}
    />,
  );

  return { onOpenChange };
}

describe("el foco del recorrido", () => {
  it("se anuncia con su título y lo que explica", () => {
    montar({ rect: RECUADRO });

    const panel = screen.getByRole("dialog", { name: "Aquí ves lo que te espera" });
    expect(panel).toHaveAccessibleDescription("Lo que tus hijos marcaron y no has aprobado.");
  });

  /*
   * Lo destacado y el panel son cosas distintas: el hueco es decorativo y no se
   * anuncia, porque lo que dice qué se está señalando es el texto.
   */
  it("destaca sin anunciar el hueco", () => {
    const { container } = render(
      <Spotlight
        open
        onOpenChange={() => {}}
        title="Título"
        description="Descripción"
        rect={RECUADRO}
        footer={<button type="button">Seguir</button>}
      />,
    );

    // El hueco vive en el portal, no en el contenedor del render.
    void container;
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("cierra con la tecla de escape, que es lo que se hereda de Radix", async () => {
    const { onOpenChange } = montar({ rect: RECUADRO });

    await userEvent.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("el control de avanzar está dentro del panel, que es lo único que actúa", () => {
    montar({ rect: RECUADRO });

    const panel = screen.getByRole("dialog");
    expect(panel.contains(screen.getByRole("button", { name: "Seguir" }))).toBe(true);
  });

  /*
   * Sin nada que destacar tiene que seguir funcionando: es el caso de un paso
   * cuya parte no está en la pantalla, y de una cuenta recién creada — que es
   * justo cuando el recorrido más falta hace.
   */
  it("sin nada que destacar sigue mostrando su panel", () => {
    montar();

    expect(screen.getByRole("dialog", { name: "Aquí ves lo que te espera" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seguir" })).toBeInTheDocument();
  });
});

/**
 * El panel NO TAPA lo que destaca, y esto es una garantía y no una tendencia.
 *
 * La primera versión miraba en qué mitad caía el hueco y ponía el panel al otro
 * lado. No bastaba: el panel mide lo que mida su contenido, así que en una
 * pantalla baja crecía hasta meterse en el hueco igualmente — el lado era el
 * correcto y el tamaño no.
 *
 * Se comprueba con NÚMEROS: dónde empieza el panel y cuánto puede medir, contra
 * dónde está el hueco. Mirar la clase que lo ancla solo probaría el lado, que es
 * justo la mitad que se quedó corta.
 */
describe("el panel cabe en la banda libre, sin tocar lo destacado", () => {
  function estilo(): CSSStyleDeclaration {
    return screen.getByRole("dialog").style;
  }

  it("con el hueco arriba, el panel empieza POR DEBAJO de él", () => {
    const hueco = { top: 40, left: 40, width: 200, height: 100 };
    montar({ rect: hueco });

    expect(Number.parseInt(estilo().top, 10)).toBeGreaterThanOrEqual(hueco.top + hueco.height);
  });

  it("y con el hueco abajo, el panel acaba POR ENCIMA de él", () => {
    const alto = window.innerHeight;
    const hueco = { top: alto - 140, left: 40, width: 200, height: 100 };
    montar({ rect: hueco });

    // `bottom` se mide desde abajo: el panel acaba a `alto - bottom`, que tiene
    // que quedar por encima de donde empieza el hueco.
    const desdeAbajo = Number.parseInt(estilo().bottom, 10);
    expect(alto - desdeAbajo).toBeLessThanOrEqual(hueco.top);
  });

  /*
   * La mitad que faltaba: el panel se LIMITA a la banda libre. Sin tope, un
   * contenido largo crece hasta invadir el hueco por mucho que el lado sea el
   * correcto — que es exactamente lo que pasaba.
   */
  it("y nunca puede medir más que la banda que le queda", () => {
    const alto = window.innerHeight;
    const hueco = { top: 40, left: 40, width: 200, height: 100 };
    montar({ rect: hueco });

    const bandaLibre = alto - (hueco.top + hueco.height);
    expect(Number.parseInt(estilo().maxHeight, 10)).toBeLessThanOrEqual(bandaLibre);
  });

  it("sin nada que destacar sigue teniendo tope, por si el contenido crece", () => {
    montar();

    expect(estilo().maxHeight).not.toBe("");
  });
});
