import type { SelectableProfile } from "@monedin/contracts";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { SOLO_CUENTA, comoNino, comoPadre, montarApp } from "../support/router.js";

/**
 * El modo de administración de la rejilla.
 *
 * Lo que hay que probar es a DÓNDE se acaba, y eso solo se ve con un router de
 * verdad: el destino después del PIN lo decide la guarda, no el componente que
 * llamó a la mutación. Ver la decisión 2 del design de `redesign-profile-grid`.
 */

const PERFILES: SelectableProfile[] = [
  { id: "parent", familyRole: "PARENT", name: "Lucía", avatar: "nutria", locked: false },
  { id: "hijo-1", familyRole: "CHILD", name: "Mateo", avatar: "zorro", locked: false },
  { id: "hijo-2", familyRole: "CHILD", name: "Emma", avatar: "koala", locked: true },
];

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("a dónde se aterriza después del PIN", () => {
  /*
   * Se monta ya CON actor sobre la dirección del teclado. Es exactamente el
   * estado en el que la guarda se reevalúa cuando la mutación de entrar
   * invalida la sesión, que es el momento que decide el destino.
   */
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

  /*
   * Un valor inválido CAE al de por defecto en vez de rechazarse: quien «llama»
   * aquí es una persona con un enlace viejo, no código. Es la convención del
   * front y lo contrario del 422 de la API.
   */
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

  /*
   * Un lápiz como botón encima de un enlace serían dos objetivos de toque
   * solapados justo donde el dedo de un niño ya falla, y dos paradas de teclado
   * para una sola cosa. Ver la decisión 3 del design.
   */
  it("cada tesela es UNA sola cosa interactiva", async () => {
    await montarApp("/profiles?manage=true", SOLO_CUENTA, PERFILES);

    const tesela = await screen.findByRole("link", {
      name: `${messages.auth.editProfile} Mateo`,
    });

    expect(within(tesela).queryByRole("button")).toBeNull();
    expect(within(tesela).queryByRole("link")).toBeNull();
  });

  /*
   * Lo cazó tocando la aplicación, no un test.
   *
   * La rejilla se guardaba con `requireAccount`, que admite un perfil ya
   * activo, mientras el teclado se guarda con `requireProfileChoice`, que no.
   * Con Mateo dentro, el lápiz sobre Lucía rebotaba a los ajustes de MATEO sin
   * pedir el PIN de Lucía — y con el modo administrar eso ya no parece «no pasó
   * nada», parece que funcionó.
   */
  it("con un perfil ya activo, la rejilla no se pinta", async () => {
    const app = await montarApp("/profiles?manage=true", comoNino(), PERFILES);

    expect(app.direccion()).toBe("/");
  });

  /*
   * La corona lleva NOMBRE y no es decorativa: un icono suelto hay que
   * aprenderlo, y quien no ve la pantalla no lo aprende nunca. Ver la decisión
   * 2 del design de `polish-profile-tiles`.
   */
  it("el perfil del adulto se anuncia como tal, y los de los hijos no", async () => {
    await montarApp("/profiles", SOLO_CUENTA, PERFILES);

    const adulto = await screen.findByRole("link", { name: /Lucía/ });
    expect(within(adulto).getByRole("img", { name: messages.auth.adultProfile })).toBeInTheDocument();

    const hijo = screen.getByRole("link", { name: /Mateo/ });
    expect(within(hijo).queryByRole("img", { name: messages.auth.adultProfile })).toBeNull();
  });

  /*
   * El crecimiento va bajo `motion-safe` y el realce de color NO. Bajo
   * movimiento reducido el sistema pone las duraciones a 1 ms, y eso convierte
   * el crecimiento en un salto instantáneo: peor para quien pidió no ver
   * movimiento, no mejor. Es la lección de `add-landing-page`.
   */
  it("el crecimiento al señalar solo ocurre si el movimiento está permitido", async () => {
    await montarApp("/profiles", SOLO_CUENTA, PERFILES);

    const tesela = await screen.findByRole("link", { name: /Mateo/ });

    expect(tesela.className).toContain("motion-safe:hover:scale-105");
    // El realce que NO es movimiento se queda encendido en los dos casos, para
    // que con movimiento reducido la tesela siga respondiendo.
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
