import type { SelectableProfile } from "@monedin/contracts";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { SOLO_CUENTA, comoNino, comoPadre, montarApp } from "../support/router.js";

const PERFILES: SelectableProfile[] = [
  { id: "parent", familyRole: "PARENT", name: "Lucía", avatar: "nutria", locked: false },
  { id: "hijo-1", familyRole: "CHILD", name: "Mateo", avatar: "zorro", locked: false },
  { id: "hijo-2", familyRole: "CHILD", name: "Emma", avatar: "koala", locked: true },
];

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("a dónde se aterriza después del PIN", () => {
  it("administrando, un padre acaba donde edita lo suyo", async () => {
    const app = await montarApp("/profiles/parent/pin?manage=true", comoPadre(), PERFILES);

    expect(app.direccion()).toBe("/account");
  });

  it("administrando, un niño acaba donde edita lo suyo", async () => {
    const app = await montarApp("/profiles/hijo-1/pin?manage=true", comoNino(), PERFILES);

    expect(app.direccion()).toBe("/me/settings");
  });

  it("sin administrar, un padre sigue acabando en el inicio", async () => {
    const app = await montarApp("/profiles/parent/pin", comoPadre(), PERFILES);

    expect(app.direccion()).toBe("/");
  });

  it("sin administrar, un niño sigue acabando en el inicio", async () => {
    const app = await montarApp("/profiles/hijo-1/pin", comoNino(), PERFILES);

    expect(app.direccion()).toBe("/");
  });

  it("un valor inválido deja el modo apagado, no rompe la pantalla", async () => {
    const app = await montarApp("/profiles/parent/pin?manage=platano", comoPadre(), PERFILES);

    expect(app.direccion()).toBe("/");
  });

  it("«manage=false» es apagado, no encendido", async () => {
    const app = await montarApp("/profiles/parent/pin?manage=false", comoPadre(), PERFILES);

    expect(app.direccion()).toBe("/");
  });
});

describe("la rejilla en modo de administración", () => {
  it("sin el modo, cada perfil se ofrece por su nombre", async () => {
    await montarApp("/profiles", SOLO_CUENTA, PERFILES);

    expect(await screen.findByRole("link", { name: "Mateo" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: `${messages.auth.editProfile} Mateo` })).toBeNull();
  });

  it("con el modo, cada perfil entrable se ofrece para editarlo", async () => {
    await montarApp("/profiles?manage=true", SOLO_CUENTA, PERFILES);

    expect(
      await screen.findByRole("link", { name: `${messages.auth.editProfile} Mateo` }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: `${messages.auth.editProfile} Lucía` }),
    ).toBeInTheDocument();
  });

  it("un perfil bloqueado no es un enlace, ni con el modo encendido", async () => {
    await montarApp("/profiles?manage=true", SOLO_CUENTA, PERFILES);

    await screen.findByRole("link", { name: `${messages.auth.editProfile} Mateo` });

    expect(screen.queryByRole("link", { name: /Emma/ })).toBeNull();
    expect(screen.getByText(messages.auth.profileLocked)).toBeInTheDocument();
  });

  it("cada tesela es UNA sola cosa interactiva", async () => {
    await montarApp("/profiles?manage=true", SOLO_CUENTA, PERFILES);

    const tesela = await screen.findByRole("link", {
      name: `${messages.auth.editProfile} Mateo`,
    });

    expect(within(tesela).queryByRole("button")).toBeNull();
    expect(within(tesela).queryByRole("link")).toBeNull();
  });

  it("con un perfil ya activo, la rejilla no se pinta", async () => {
    const app = await montarApp("/profiles?manage=true", comoNino(), PERFILES);

    expect(app.direccion()).toBe("/");
  });

  it("el perfil del adulto se anuncia como tal, y los de los hijos no", async () => {
    await montarApp("/profiles", SOLO_CUENTA, PERFILES);

    const adulto = await screen.findByRole("link", { name: /Lucía/ });
    expect(within(adulto).getByRole("img", { name: messages.auth.adultProfile })).toBeInTheDocument();

    const hijo = screen.getByRole("link", { name: /Mateo/ });
    expect(within(hijo).queryByRole("img", { name: messages.auth.adultProfile })).toBeNull();
  });

  it("el crecimiento al señalar solo ocurre si el movimiento está permitido", async () => {
    await montarApp("/profiles", SOLO_CUENTA, PERFILES);

    const tesela = await screen.findByRole("link", { name: /Mateo/ });

    expect(tesela.className).toContain("motion-safe:hover:scale-105");

    expect(tesela.className).toContain("hover:bg-surface-sunken");
    expect(tesela.className).not.toMatch(/(?<!motion-safe:)hover:scale/);
  });

  it("el botón enciende el modo, y «Listo» lo apaga", async () => {
    const app = await montarApp("/profiles", SOLO_CUENTA, PERFILES);

    await userEvent.click(await screen.findByRole("link", { name: messages.auth.manageProfiles }));
    expect(app.router.state.location.searchStr).toContain("manage=true");

    await userEvent.click(await screen.findByRole("link", { name: messages.auth.manageDone }));
    expect(app.router.state.location.searchStr).not.toContain("manage=true");
  });
});

describe("el modo de administración se anuncia en la pantalla", () => {
  it("con el modo, dice qué hará tocar un perfil", async () => {
    await montarApp("/profiles?manage=true", SOLO_CUENTA, PERFILES);

    expect(await screen.findByText(messages.auth.manageProfilesLead)).toBeInTheDocument();
  });

  it("y sin el modo, no lo dice", async () => {
    await montarApp("/profiles", SOLO_CUENTA, PERFILES);

    await screen.findByText(messages.auth.whoIsPlaying);
    expect(screen.queryByText(messages.auth.manageProfilesLead)).toBeNull();
  });

  it("y la rejilla normal dice la suya, que no es la misma", async () => {
    await montarApp("/profiles", SOLO_CUENTA, PERFILES);

    expect(await screen.findByText(messages.auth.whoIsPlayingLead)).toBeInTheDocument();
  });
});
