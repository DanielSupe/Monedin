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

describe("el alta de un perfil explica lo que no ofrece", () => {
  it("dice que la foto se pone al editar", async () => {
    await montarApp("/profiles/new", SOLO_CUENTA);

    expect(await screen.findByText(messages.children.photoLater)).toBeInTheDocument();
    expect(screen.queryByLabelText(messages.uploads.choose)).toBeNull();
  });

  it("y editar un perfil ya creado SÍ ofrece la foto", async () => {
    await montarApp("/children/h1/edit", comoPadre(), [], {
      [`/children/${MATEO.id}`]: MATEO,
      "/children": pagina([MATEO]),
    });

    expect(await screen.findByLabelText(messages.uploads.choose)).toBeInTheDocument();

    expect(screen.queryByText(messages.children.photoLater)).toBeNull();
  });
});

void API_PREFIX;
