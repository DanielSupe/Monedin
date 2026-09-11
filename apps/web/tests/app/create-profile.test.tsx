import { API_PREFIX, type Child } from "@monedin/contracts";
import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { SOLO_CUENTA, comoPadre, montarApp, pagina } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

const MATEO: Child = {
  id: "h1",
  name: "Mateo",
  avatar: "zorro",
  age: 8,
  coins: 120,
  locked: false,
  createdAt: "2026-09-01T10:00:00.000Z",
};

/**
 * LA FOTO NO SE PUEDE PONER AL CREAR, Y ESO HAY QUE DECIRLO CON SU SALIDA.
 *
 * Es deuda conocida y con dueño: la clave de subida cuelga del identificador del
 * hijo, que en el alta todavía no existe. Lo que no puede pasar es que el hueco
 * quede sin explicar — un padre que busca la foto y no la encuentra concluye que
 * el producto no la tiene.
 *
 * Y se comprueban las DOS mitades. Que la frase diga dónde SÍ se puede es lo que
 * la separa de un «aquí no» a secas, que deja a quien lo lee sin saber qué
 * hacer; y que editar lo ofrezca de verdad es lo que impide que la frase mienta.
 * Con solo la primera, borrar el subidor de la edición no rompería nada.
 */
describe("el alta de un perfil explica lo que no ofrece", () => {
  it("dice que la foto se pone al editar", async () => {
    await montarApp("/profiles/new", SOLO_CUENTA);

    expect(await screen.findByText(messages.children.photoLater)).toBeInTheDocument();
    expect(screen.queryByLabelText(messages.uploads.choose)).toBeNull();
  });

  it("y editar un perfil ya creado SÍ ofrece la foto", async () => {
    await montarApp("/children/h1/edit", comoPadre(), [], {
      // El MÁS específico primero: las respuestas se recorren en orden y
      // `/children` casaría también con `/children/h1`.
      [`/children/${MATEO.id}`]: MATEO,
      "/children": pagina([MATEO]),
    });

    expect(await screen.findByLabelText(messages.uploads.choose)).toBeInTheDocument();
    // Y ahí la explicación sobra: lo que anunciaba ya está delante.
    expect(screen.queryByText(messages.children.photoLater)).toBeNull();
  });
});

void API_PREFIX;
