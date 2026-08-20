import { describe, expect, it } from "vitest";
import {
  type Actor,
  type ChildActor,
  type ParentActor,
  isChild,
  isParent,
  owningParentId,
} from "../../src/shared/actor.js";

/**
 * El valor de la unión discriminada está en lo que NO compila.
 *
 * Los `@ts-expect-error` de abajo son el test de verdad: si alguien vuelve a
 * convertir `Actor` en un objeto con campos opcionales, dejan de ser errores y
 * `tsc` falla diciendo que la directiva no se usó. Por eso `typecheck` incluye
 * el directorio de tests.
 */
describe("forma del actor", () => {
  it("no admite un actor de niño sin su perfil", () => {
    // @ts-expect-error falta childProfileId, que es obligatorio para un niño
    const invalido: Actor = { familyRole: "CHILD", parentId: "p1" };

    expect(invalido).toBeTruthy();
  });

  it("no admite un actor de niño sin el padre", () => {
    // @ts-expect-error falta parentId
    const invalido: Actor = { familyRole: "CHILD", childProfileId: "c1" };

    expect(invalido).toBeTruthy();
  });

  it("no admite un actor de padre con perfil de niño", () => {
    // @ts-expect-error un padre no tiene childProfileId
    const invalido: Actor = { familyRole: "PARENT", userId: "u1", childProfileId: "c1" };

    expect(invalido).toBeTruthy();
  });

  it("no admite un actor de niño con userId: el niño no es un User", () => {
    // @ts-expect-error el niño no tiene identificador de usuario
    const invalido: Actor = { familyRole: "CHILD", childProfileId: "c1", parentId: "p1", userId: "u1" };

    expect(invalido).toBeTruthy();
  });

  it("admite las dos formas válidas", () => {
    const padre: ParentActor = { familyRole: "PARENT", userId: "u1" };
    const nino: ChildActor = { familyRole: "CHILD", childProfileId: "c1", parentId: "u1" };

    expect(padre.userId).toBe("u1");
    expect(nino.childProfileId).toBe("c1");
  });
});

describe("estrechamiento del actor", () => {
  const padre: Actor = { familyRole: "PARENT", userId: "u1" };
  const nino: Actor = { familyRole: "CHILD", childProfileId: "c1", parentId: "u1" };

  it("distingue padre de niño", () => {
    expect(isParent(padre)).toBe(true);
    expect(isChild(padre)).toBe(false);
    expect(isParent(nino)).toBe(false);
    expect(isChild(nino)).toBe(true);
  });

  it("da acceso tipado al campo propio de cada rama", () => {
    if (isParent(padre)) {
      expect(padre.userId).toBe("u1");
    }
    if (isChild(nino)) {
      expect(nino.childProfileId).toBe("c1");
    }
  });
});

describe("dueño de los datos", () => {
  it("para un padre es él mismo", () => {
    expect(owningParentId({ familyRole: "PARENT", userId: "u1" })).toBe("u1");
  });

  it("para un niño es su padre", () => {
    expect(owningParentId({ familyRole: "CHILD", childProfileId: "c1", parentId: "u1" })).toBe("u1");
  });
});
