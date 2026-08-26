import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  API_PREFIX,
  AVATAR_KEYS,
  DEFAULT_AVATAR_KEY,
  DEFAULT_PAGE_SIZE,
  CHILD_AGE_MAX,
  CHILD_AGE_MIN,
  COINS_MAX,
  COINS_MIN,
  ERROR_CODES,
  MAX_CHILDREN_PER_FAMILY,
  MAX_PAGE_SIZE,
  REDEMPTION_STATUSES,
  REWARD_STATUSES,
  ALLOWED_IMAGE_CONTENT_TYPES,
  apiErrorSchema,
  avatarKeySchema,
  avatarValueSchema,
  completeTaskSchema,
  createChildSchema,
  createRedemptionSchema,
  createRewardSchema,
  createUploadUrlSchema,
  healthResponseSchema,
  isAvatarKey,
  listOwnRedemptionsQuerySchema,
  listOwnRewardsQuerySchema,
  listRedemptionsQuerySchema,
  listRewardsQuerySchema,
  pageOf,
  paginationQuerySchema,
  redemptionSchema,
  replaceAssignmentsSchema,
  rewardSchema,
  TASK_STATUSES,
  createTaskSchema,
  listOwnTasksQuerySchema,
  listTasksQuerySchema,
  resolveAvatarKey,
  taskBatchesPageSchema,
  updateChildSchema,
  updateOwnChildSchema,
  updateParentAvatarSchema,
  updateRewardSchema,
  updateTaskSchema,
  uploadUrlSchema,
} from "../src/index.js";

describe("constantes de dominio", () => {
  it("define el prefijo versionado una sola vez", () => {
    expect(API_PREFIX).toBe("/api/v1");
  });

  it("mantiene rangos coherentes", () => {
    expect(CHILD_AGE_MIN).toBeLessThan(CHILD_AGE_MAX);
    expect(COINS_MIN).toBeLessThan(COINS_MAX);
    expect(COINS_MIN).toBeGreaterThan(0);
  });
});

describe("esquema de error compartido", () => {
  it("acepta el cuerpo mínimo de código y mensaje", () => {
    const result = apiErrorSchema.safeParse({
      code: ERROR_CODES.NOT_FOUND,
      message: "No encontramos lo que estás buscando.",
    });

    expect(result.success).toBe(true);
  });

  it("acepta el detalle por campo de una validación", () => {
    const result = apiErrorSchema.safeParse({
      code: ERROR_CODES.VALIDATION_ERROR,
      message: "Algunos datos no son válidos.",
      details: [{ field: "coins", code: "too_small", message: "Mínimo 1." }],
    });

    expect(result.success).toBe(true);
  });

  it("rechaza un cuerpo sin código", () => {
    expect(apiErrorSchema.safeParse({ message: "algo" }).success).toBe(false);
  });

  it("no repite ningún código de error", () => {
    const codigos = Object.values(ERROR_CODES);
    expect(new Set(codigos).size).toBe(codigos.length);
  });
});

describe("esquema de health", () => {
  it("exige que el estado sea exactamente 'ok'", () => {
    expect(
      healthResponseSchema.safeParse({ status: "ok", service: "monedin-api", version: "0.0.0" })
        .success,
    ).toBe(true);

    expect(
      healthResponseSchema.safeParse({ status: "degraded", service: "monedin-api", version: "0.0.0" })
        .success,
    ).toBe(false);
  });

  it("no admite marcas de tiempo: la respuesta tiene que ser determinista", () => {
    const result = healthResponseSchema.parse({
      status: "ok",
      service: "monedin-api",
      version: "0.0.0",
      timestamp: "2026-08-20T00:00:00Z",
    });

    expect(result).not.toHaveProperty("timestamp");
  });
});

describe("catálogo de avatares", () => {
  it("no repite ninguna clave", () => {
    expect(new Set(AVATAR_KEYS).size).toBe(AVATAR_KEYS.length);
  });

  it("reconoce una clave del catálogo", () => {
    for (const key of AVATAR_KEYS) {
      expect(isAvatarKey(key)).toBe(true);
    }
  });

  it("rechaza una clave que no está", () => {
    expect(isAvatarKey("dragon")).toBe(false);
    expect(isAvatarKey("")).toBe(false);
    expect(isAvatarKey(null)).toBe(false);
    expect(isAvatarKey(42)).toBe(false);
  });

  it("el avatar por defecto está en el catálogo", () => {
    expect(isAvatarKey(DEFAULT_AVATAR_KEY)).toBe(true);
  });

  it("un perfil sin avatar resuelve al de por defecto", () => {
    expect(resolveAvatarKey(null)).toBe(DEFAULT_AVATAR_KEY);
    expect(resolveAvatarKey(undefined)).toBe(DEFAULT_AVATAR_KEY);
    // Una clave que ya no está en el catálogo tampoco deja el perfil sin cara.
    expect(resolveAvatarKey("clave-retirada")).toBe(DEFAULT_AVATAR_KEY);
  });

  it("un perfil con avatar del catálogo conserva el suyo", () => {
    expect(resolveAvatarKey("zorro")).toBe("zorro");
  });

  it("las claves son legibles y estables, no números", () => {
    for (const key of AVATAR_KEYS) {
      expect(key).toMatch(/^[a-z]+$/);
    }
  });

  it("el esquema acepta todas las claves del catálogo, sin huecos", () => {
    for (const key of AVATAR_KEYS) {
      expect(avatarKeySchema.safeParse(key).success).toBe(true);
    }
  });

  it("el esquema rechaza una clave inventada", () => {
    // Es la ÚNICA defensa: la columna es texto libre a nivel de motor.
    expect(avatarKeySchema.safeParse("dragon").success).toBe(false);
    expect(avatarKeySchema.safeParse("").success).toBe(false);
  });
});

describe("paginación de los listados", () => {
  it("aplica los valores por defecto del contrato cuando no se pide nada", () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  });

  it("coacciona las cadenas, porque la query siempre llega como texto", () => {
    expect(paginationQuerySchema.parse({ page: "3", pageSize: "5" })).toEqual({
      page: 3,
      pageSize: 5,
    });
  });

  it("rechaza un tamaño de página por encima del máximo, en vez de recortarlo", () => {
    // Recortar en silencio escondería el error de quien llama: pediría 500,
    // recibiría 100 y creería que hay 100.
    const result = paginationQuerySchema.safeParse({ pageSize: MAX_PAGE_SIZE + 1 });

    expect(result.success).toBe(false);
  });

  it("acepta justo el máximo", () => {
    expect(paginationQuerySchema.parse({ pageSize: MAX_PAGE_SIZE }).pageSize).toBe(MAX_PAGE_SIZE);
  });

  it("rechaza páginas y tamaños sin sentido", () => {
    for (const query of [
      { page: 0 },
      { page: -1 },
      { page: "abc" },
      { page: 1.5 },
      { pageSize: 0 },
      { pageSize: -3 },
      { pageSize: 2.5 },
    ]) {
      expect(paginationQuerySchema.safeParse(query).success, JSON.stringify(query)).toBe(false);
    }
  });

  it("la envoltura lleva el total sin paginar, que es lo que pinta el paginador", () => {
    const schema = pageOf(z.object({ id: z.string() }));

    const result = schema.safeParse({
      items: [{ id: "a" }],
      page: 1,
      pageSize: 20,
      total: 41,
      totalPages: 3,
    });

    expect(result.success).toBe(true);
  });

  it("la envoltura rechaza una respuesta sin items", () => {
    // Sin esto, una respuesta mal formada pasaría como éxito silencioso.
    const schema = pageOf(z.object({ id: z.string() }));

    expect(schema.safeParse({ page: 1, pageSize: 20, total: 0, totalPages: 1 }).success).toBe(false);
  });
});

describe("contratos de los perfiles de hijo", () => {
  const alta = { name: "Mateo", pin: "1234" };

  it("acepta un alta con lo mínimo", () => {
    expect(createChildSchema.safeParse(alta).success).toBe(true);
  });

  it("acepta un alta con edad y avatar", () => {
    expect(createChildSchema.safeParse({ ...alta, age: 8, avatar: "zorro" }).success).toBe(true);
  });

  it("el alta NO acepta monedas: sería una impresora de monedas", () => {
    // El alta es una ruta de solo cuenta y no pide PIN de adulto. Que un perfil
    // recién creado no tenga saldo es lo que hace tolerable lo primero.
    expect(createChildSchema.safeParse({ ...alta, coins: 500 }).success).toBe(false);
  });

  it("el alta NO acepta el padre dueño: sale de la sesión", () => {
    expect(createChildSchema.safeParse({ ...alta, parentId: "otro" }).success).toBe(false);
  });

  it("rechaza los datos fuera de los límites del producto", () => {
    expect(createChildSchema.safeParse({ ...alta, name: "A" }).success).toBe(false);
    expect(createChildSchema.safeParse({ ...alta, pin: "123" }).success).toBe(false);
    expect(createChildSchema.safeParse({ ...alta, pin: "abcd" }).success).toBe(false);
    expect(createChildSchema.safeParse({ ...alta, age: CHILD_AGE_MIN - 1 }).success).toBe(false);
    expect(createChildSchema.safeParse({ ...alta, age: CHILD_AGE_MAX + 1 }).success).toBe(false);
    expect(createChildSchema.safeParse({ ...alta, avatar: "dragon" }).success).toBe(false);
  });

  it("señala TODOS los campos que fallan, no solo el primero", () => {
    const result = createChildSchema.safeParse({ name: "A", pin: "x", age: 99 });

    expect(result.success).toBe(false);
    if (!result.success) {
      const campos = result.error.issues.map((issue) => issue.path.join("."));
      expect(campos).toContain("name");
      expect(campos).toContain("pin");
      expect(campos).toContain("age");
    }
  });

  it("una edición sin ningún campo no es una edición", () => {
    expect(updateChildSchema.safeParse({}).success).toBe(false);
  });

  it("la edición admite borrar la edad, que es distinto de no tocarla", () => {
    expect(updateChildSchema.safeParse({ age: null }).success).toBe(true);
  });

  it("la edición no toca el saldo", () => {
    expect(updateChildSchema.safeParse({ coins: 10 }).success).toBe(false);
  });

  it("el niño solo cambia su avatar de su propio perfil", () => {
    expect(updateOwnChildSchema.safeParse({ avatar: "panda" }).success).toBe(true);
    expect(updateOwnChildSchema.safeParse({ name: "Otro" }).success).toBe(false);
    expect(updateOwnChildSchema.safeParse({ age: 9 }).success).toBe(false);
    expect(updateOwnChildSchema.safeParse({ coins: 99 }).success).toBe(false);
  });

  it("el tope de hijos por familia es un número sensato", () => {
    // Guarda contra un 1 por error de tecleo, que dejaría a las familias con un
    // solo hijo posible.
    expect(MAX_CHILDREN_PER_FAMILY).toBeGreaterThan(1);
  });
});

describe("contrato de las tareas", () => {
  const base = { title: "Sacar la basura" } as const;

  it("acepta el reparto con el mismo valor para todos", () => {
    const result = createTaskSchema.safeParse({
      ...base,
      childIds: ["hijo-1", "hijo-2"],
      coins: 25,
    });

    expect(result.success).toBe(true);
  });

  it("acepta el reparto con un valor distinto por hijo", () => {
    const result = createTaskSchema.safeParse({
      ...base,
      assignments: [
        { childId: "hijo-1", coins: 25 },
        { childId: "hijo-2", coins: 40 },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rechaza las dos formas a la vez", () => {
    const result = createTaskSchema.safeParse({
      ...base,
      childIds: ["hijo-1"],
      coins: 25,
      assignments: [{ childId: "hijo-2", coins: 40 }],
    });

    expect(result.success).toBe(false);
  });

  it("rechaza que no venga ninguna de las dos formas", () => {
    expect(createTaskSchema.safeParse(base).success).toBe(false);
  });

  it("rechaza media forma: hijos sin valor, o valor sin hijos", () => {
    expect(createTaskSchema.safeParse({ ...base, childIds: ["hijo-1"] }).success).toBe(false);
    expect(createTaskSchema.safeParse({ ...base, coins: 25 }).success).toBe(false);
  });

  it("rechaza mezclar el valor compartido con las asignaciones por hijo", () => {
    const result = createTaskSchema.safeParse({
      ...base,
      coins: 25,
      assignments: [{ childId: "hijo-1", coins: 40 }],
    });

    expect(result.success).toBe(false);
  });

  it("rechaza un reparto sin ningún hijo", () => {
    expect(createTaskSchema.safeParse({ ...base, childIds: [], coins: 25 }).success).toBe(false);
    expect(createTaskSchema.safeParse({ ...base, assignments: [] }).success).toBe(false);
  });

  it("rechaza repetir al mismo hijo dentro del reparto", () => {
    // Repetirlo crearía dos tareas idénticas, que no es lo que nadie quiere
    // decir al elegir dos veces al mismo niño.
    expect(
      createTaskSchema.safeParse({ ...base, childIds: ["hijo-1", "hijo-1"], coins: 25 }).success,
    ).toBe(false);
    expect(
      createTaskSchema.safeParse({
        ...base,
        assignments: [
          { childId: "hijo-1", coins: 25 },
          { childId: "hijo-1", coins: 40 },
        ],
      }).success,
    ).toBe(false);
  });

  it("rechaza un valor fuera del rango del producto", () => {
    const conValor = (coins: number) =>
      createTaskSchema.safeParse({ ...base, childIds: ["hijo-1"], coins }).success;

    expect(conValor(COINS_MIN - 1)).toBe(false);
    expect(conValor(COINS_MAX + 1)).toBe(false);
    expect(conValor(-5)).toBe(false);
    expect(conValor(12.5)).toBe(false);
    expect(conValor(COINS_MIN)).toBe(true);
    expect(conValor(COINS_MAX)).toBe(true);

    expect(
      createTaskSchema.safeParse({ ...base, assignments: [{ childId: "h", coins: 0 }] }).success,
    ).toBe(false);
  });

  it("el alta no acepta el padre dueño ni el estado inicial", () => {
    const conExtra = (extra: Record<string, unknown>) =>
      createTaskSchema.safeParse({ ...base, childIds: ["hijo-1"], coins: 25, ...extra }).success;

    expect(conExtra({ parentId: "otro" })).toBe(false);
    expect(conExtra({ status: "APPROVED" })).toBe(false);
  });

  it("la fecha límite es opcional y tiene que ser una fecha ISO", () => {
    const conFecha = (dueDate: unknown) =>
      createTaskSchema.safeParse({ ...base, childIds: ["h"], coins: 25, dueDate }).success;

    expect(createTaskSchema.safeParse({ ...base, childIds: ["h"], coins: 25 }).success).toBe(true);
    expect(conFecha("2026-09-01T10:00:00.000Z")).toBe(true);
    expect(conFecha("2026-09-01T10:00:00-05:00")).toBe(true);
    expect(conFecha("el martes")).toBe(false);
    expect(conFecha("2026-09-01")).toBe(false);
  });

  it("la edición no reasigna la tarea a otro hijo", () => {
    // Cambiar de hijo es borrar la pendiente y crear otra. Al ser `.strict()`,
    // esto es 422 y no un campo que se ignora en silencio.
    expect(updateTaskSchema.safeParse({ childId: "hijo-2" }).success).toBe(false);
    expect(updateTaskSchema.safeParse({ title: "Otro", childId: "hijo-2" }).success).toBe(false);
  });

  it("la edición no mueve el estado: para eso están las transiciones", () => {
    expect(updateTaskSchema.safeParse({ status: "APPROVED" }).success).toBe(false);
  });

  it("una edición sin ningún campo no es una edición", () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(false);
  });

  it("la edición admite borrar la descripción y la fecha límite", () => {
    expect(updateTaskSchema.safeParse({ description: null }).success).toBe(true);
    expect(updateTaskSchema.safeParse({ dueDate: null }).success).toBe(true);
  });

  it("los filtros del listado rechazan un estado inventado", () => {
    expect(listTasksQuerySchema.safeParse({ status: "COMPLETED" }).success).toBe(true);
    expect(listTasksQuerySchema.safeParse({ status: "REJECTED" }).success).toBe(false);
    expect(listTasksQuerySchema.safeParse({ status: "completed" }).success).toBe(false);
  });

  it("el listado del padre pagina y filtra por hijo", () => {
    const result = listTasksQuerySchema.safeParse({ page: "2", pageSize: "5", childId: "hijo-1" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({ page: 2, pageSize: 5, childId: "hijo-1" });
    }
  });

  it("los dos listados heredan la paginación por defecto y su tope", () => {
    // `.extend()` no puede perder lo que hereda: un tamaño por encima del
    // máximo sigue siendo 422 y no un recorte silencioso.
    expect(listTasksQuerySchema.safeParse({ pageSize: String(MAX_PAGE_SIZE + 1) }).success).toBe(
      false,
    );
    expect(listOwnTasksQuerySchema.safeParse({ pageSize: String(MAX_PAGE_SIZE + 1) }).success).toBe(
      false,
    );

    const propio = listOwnTasksQuerySchema.safeParse({});
    expect(propio.success).toBe(true);
    if (propio.success) {
      expect(propio.data).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
    }
  });

  it("el listado del niño NO admite pedir el de otro", () => {
    // Aquí está la garantía de que un niño no ve a su hermano: no hay ningún
    // parámetro que pudiera apuntar a otro perfil.
    expect(listOwnTasksQuerySchema.safeParse({ childId: "hermano" }).success).toBe(false);
    expect(listOwnTasksQuerySchema.safeParse({ status: "PENDING" }).success).toBe(true);
  });

  it("los estados son los tres del ciclo, sin rechazo terminal", () => {
    expect([...TASK_STATUSES]).toEqual(["PENDING", "COMPLETED", "APPROVED"]);
    expect(TASK_STATUSES).not.toContain("REJECTED");
  });

  it("la página de repartos lleva los metadatos en el cuerpo", () => {
    const result = taskBatchesPageSchema.safeParse({
      items: [
        {
          batchId: "reparto-1",
          title: "Sacar la basura",
          description: null,
          dueDate: null,
          createdAt: "2026-08-24T10:00:00.000Z",
          tasks: [
            {
              id: "tarea-1",
              batchId: "reparto-1",
              title: "Sacar la basura",
              description: null,
              coins: 25,
              status: "PENDING",
              dueDate: null,
              evidence: null,
              child: { id: "hijo-1", name: "Mateo", avatar: DEFAULT_AVATAR_KEY },
              createdAt: "2026-08-24T10:00:00.000Z",
              updatedAt: "2026-08-24T10:00:00.000Z",
            },
          ],
        },
      ],
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      total: 1,
      totalPages: 1,
    });

    expect(result.success).toBe(true);
  });
});

describe("contrato de los premios", () => {
  const base = { title: "Ir al cine" } as const;

  it("acepta el alta con el mismo precio para todos", () => {
    const result = createRewardSchema.safeParse({
      ...base,
      childIds: ["hijo-1", "hijo-2"],
      coins: 200,
    });

    expect(result.success).toBe(true);
  });

  it("acepta el alta con un precio distinto por hijo", () => {
    const result = createRewardSchema.safeParse({
      ...base,
      assignments: [
        { childId: "hijo-1", coins: 200 },
        { childId: "hijo-2", coins: 150 },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rechaza las dos formas de precio a la vez", () => {
    const result = createRewardSchema.safeParse({
      ...base,
      childIds: ["hijo-1"],
      coins: 200,
      assignments: [{ childId: "hijo-2", coins: 150 }],
    });

    expect(result.success).toBe(false);
  });

  it("rechaza que no venga ninguna de las dos formas", () => {
    expect(createRewardSchema.safeParse(base).success).toBe(false);
  });

  it("rechaza repetir al mismo hijo en el alta", () => {
    expect(
      createRewardSchema.safeParse({ ...base, childIds: ["hijo-1", "hijo-1"], coins: 200 })
        .success,
    ).toBe(false);
  });

  it("rechaza un precio fuera del rango del producto", () => {
    const conPrecio = (coins: number) =>
      createRewardSchema.safeParse({ ...base, childIds: ["hijo-1"], coins }).success;

    expect(conPrecio(COINS_MIN - 1)).toBe(false);
    expect(conPrecio(0)).toBe(false);
    expect(conPrecio(COINS_MAX + 1)).toBe(false);
    expect(conPrecio(COINS_MIN)).toBe(true);
    expect(conPrecio(COINS_MAX)).toBe(true);
  });

  it("el alta no acepta el padre dueño ni el estado inicial", () => {
    const conExtra = (extra: Record<string, unknown>) =>
      createRewardSchema.safeParse({ ...base, childIds: ["hijo-1"], coins: 200, ...extra })
        .success;

    expect(conExtra({ parentId: "otro" })).toBe(false);
    expect(conExtra({ isActive: false })).toBe(false);
  });

  it("la edición NO acepta precio: cambiarlo es cambiar la oferta a un hijo", () => {
    expect(updateRewardSchema.safeParse({ title: "Otro título" }).success).toBe(true);
    expect(updateRewardSchema.safeParse({ coins: 200 }).success).toBe(false);
    expect(updateRewardSchema.safeParse({ title: "Otro", coins: 200 }).success).toBe(false);
  });

  it("una edición sin ningún campo no es una edición", () => {
    expect(updateRewardSchema.safeParse({}).success).toBe(false);
  });

  it("la edición admite borrar la descripción", () => {
    expect(updateRewardSchema.safeParse({ description: null }).success).toBe(true);
  });

  it("el reemplazo de ofertas acepta un conjunto vacío", () => {
    // Es cómo se retira la oferta a todos sin retirar el premio.
    expect(replaceAssignmentsSchema.safeParse({ assignments: [] }).success).toBe(true);
  });

  it("el reemplazo de ofertas rechaza un hijo repetido en el conjunto", () => {
    const result = replaceAssignmentsSchema.safeParse({
      assignments: [
        { childId: "hijo-1", coins: 100 },
        { childId: "hijo-1", coins: 150 },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("el reemplazo de ofertas rechaza un precio fuera de rango", () => {
    const result = replaceAssignmentsSchema.safeParse({
      assignments: [{ childId: "hijo-1", coins: COINS_MAX + 1 }],
    });

    expect(result.success).toBe(false);
  });

  it("la query del niño NO admite pedir el escaparate de otro", () => {
    // Es la garantía de que un niño no puede pedir el precio de su hermano:
    // no hay ningún parámetro que pudiera apuntar a otro perfil.
    expect(listOwnRewardsQuerySchema.safeParse({ childId: "hermano" }).success).toBe(false);
    expect(listOwnRewardsQuerySchema.safeParse({}).success).toBe(true);
  });

  it("el filtro del catálogo rechaza un estado inventado", () => {
    expect(listRewardsQuerySchema.safeParse({ status: "ACTIVE" }).success).toBe(true);
    expect(listRewardsQuerySchema.safeParse({ status: "RETIRED" }).success).toBe(true);
    expect(listRewardsQuerySchema.safeParse({ status: "DELETED" }).success).toBe(false);
  });

  it("el filtro del catálogo es ACTIVE por defecto", () => {
    const result = listRewardsQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("ACTIVE");
    }
  });

  it("los estados del filtro son exactamente activo y retirado", () => {
    expect([...REWARD_STATUSES]).toEqual(["ACTIVE", "RETIRED"]);
  });

  it("un premio se ve con todas sus ofertas, cada una con el hijo y su precio", () => {
    const result = rewardSchema.safeParse({
      id: "premio-1",
      title: "Ir al cine",
      description: null,
      image: null,
      status: "ACTIVE",
      offers: [
        { child: { id: "hijo-1", name: "Ana", avatar: DEFAULT_AVATAR_KEY }, coins: 200 },
        { child: { id: "hijo-2", name: "Bruno", avatar: DEFAULT_AVATAR_KEY }, coins: 150 },
      ],
      createdAt: "2026-08-24T10:00:00.000Z",
      updatedAt: "2026-08-24T10:00:00.000Z",
    });

    expect(result.success).toBe(true);
  });

  it("un premio sin ninguna oferta es válido", () => {
    const result = rewardSchema.safeParse({
      id: "premio-1",
      title: "Ir al cine",
      description: null,
      image: null,
      status: "ACTIVE",
      offers: [],
      createdAt: "2026-08-24T10:00:00.000Z",
      updatedAt: "2026-08-24T10:00:00.000Z",
    });

    expect(result.success).toBe(true);
  });
});

describe("contrato de los canjes", () => {
  it("acepta la solicitud con solo el identificador del premio", () => {
    expect(createRedemptionSchema.safeParse({ rewardId: "premio-1" }).success).toBe(true);
  });

  it("la solicitud NO acepta el hijo ni el precio: los decide el servidor", () => {
    expect(
      createRedemptionSchema.safeParse({ rewardId: "premio-1", childId: "hijo-1" }).success,
    ).toBe(false);
    expect(createRedemptionSchema.safeParse({ rewardId: "premio-1", coins: 100 }).success).toBe(
      false,
    );
  });

  it("la query del niño NO admite pedir los canjes de otro", () => {
    expect(listOwnRedemptionsQuerySchema.safeParse({ childId: "hermano" }).success).toBe(false);
    expect(listOwnRedemptionsQuerySchema.safeParse({}).success).toBe(true);
  });

  it("el filtro de la bandeja del padre rechaza un estado inventado", () => {
    expect(listRedemptionsQuerySchema.safeParse({ status: "PENDING" }).success).toBe(true);
    expect(listRedemptionsQuerySchema.safeParse({ status: "APPROVED" }).success).toBe(true);
    expect(listRedemptionsQuerySchema.safeParse({ status: "REJECTED" }).success).toBe(true);
    expect(listRedemptionsQuerySchema.safeParse({ status: "CANCELLED" }).success).toBe(false);
  });

  it("los estados del canje son exactamente pendiente, aprobado y rechazado", () => {
    expect([...REDEMPTION_STATUSES]).toEqual(["PENDING", "APPROVED", "REJECTED"]);
  });

  it("un canje se ve con el premio y el hijo que lo solicitó", () => {
    const result = redemptionSchema.safeParse({
      id: "canje-1",
      coins: 60,
      status: "PENDING",
      reward: { id: "premio-1", title: "Helado" },
      child: { id: "hijo-1", name: "Ana", avatar: DEFAULT_AVATAR_KEY },
      createdAt: "2026-08-24T10:00:00.000Z",
      updatedAt: "2026-08-24T10:00:00.000Z",
    });

    expect(result.success).toBe(true);
  });
});

describe("contrato de la subida de imágenes", () => {
  it("un avatar se lee como clave del catálogo o como URL, y nada más", () => {
    expect(avatarValueSchema.safeParse(DEFAULT_AVATAR_KEY).success).toBe(true);
    expect(avatarValueSchema.safeParse("https://bucket.example/avatars/x.jpg").success).toBe(true);

    // Una clave cruda del almacén NO es una forma válida de lectura: si se
    // colara, el front la pintaría como si fuera una ilustración del catálogo y
    // acabaría enseñando el avatar por defecto sin que nadie se enterara.
    expect(avatarValueSchema.safeParse("avatars/children/hijo-1/abc.jpg").success).toBe(false);
    expect(avatarValueSchema.safeParse("").success).toBe(false);
  });

  it("pedir una URL de subida solo acepta el tipo de contenido", () => {
    expect(createUploadUrlSchema.safeParse({ contentType: "image/jpeg" }).success).toBe(true);
    expect(createUploadUrlSchema.safeParse({ contentType: "image/gif" }).success).toBe(false);
    expect(createUploadUrlSchema.safeParse({ contentType: "image/svg+xml" }).success).toBe(false);

    // La clave la decide el servidor: mandarla es 422 y no un campo ignorado.
    expect(
      createUploadUrlSchema.safeParse({ contentType: "image/jpeg", key: "la/que/yo/quiera.jpg" })
        .success,
    ).toBe(false);
  });

  it("los tipos admitidos son exactamente los tres que el navegador produce", () => {
    expect([...ALLOWED_IMAGE_CONTENT_TYPES]).toEqual(["image/jpeg", "image/png", "image/webp"]);
  });

  it("la respuesta de subida trae dónde subir, con qué clave y hasta cuándo", () => {
    const result = uploadUrlSchema.safeParse({
      uploadUrl: "https://bucket.example/avatars/children/hijo-1/abc.jpg?firma=x",
      key: "avatars/children/hijo-1/abc.jpg",
      expiresAt: "2026-08-25T10:05:00.000Z",
    });

    expect(result.success).toBe(true);
  });

  it("el niño elige catálogo O foto, pero nunca las dos ni ninguna", () => {
    expect(updateOwnChildSchema.safeParse({ avatar: DEFAULT_AVATAR_KEY }).success).toBe(true);
    expect(updateOwnChildSchema.safeParse({ avatarUploadKey: "avatars/children/x/a.jpg" }).success).toBe(
      true,
    );

    expect(updateOwnChildSchema.safeParse({}).success).toBe(false);
    expect(
      updateOwnChildSchema.safeParse({
        avatar: DEFAULT_AVATAR_KEY,
        avatarUploadKey: "avatars/children/x/a.jpg",
      }).success,
    ).toBe(false);
  });

  it("el padre tampoco puede mandar las dos formas al editar a un hijo", () => {
    expect(updateChildSchema.safeParse({ avatar: DEFAULT_AVATAR_KEY }).success).toBe(true);
    expect(updateChildSchema.safeParse({ avatarUploadKey: "avatars/children/x/a.jpg" }).success).toBe(
      true,
    );
    expect(
      updateChildSchema.safeParse({
        avatar: DEFAULT_AVATAR_KEY,
        avatarUploadKey: "avatars/children/x/a.jpg",
      }).success,
    ).toBe(false);
  });

  it("el avatar del padre se confirma solo con la foto subida", () => {
    expect(updateParentAvatarSchema.safeParse({ avatarUploadKey: "avatars/parents/p/a.jpg" }).success).toBe(
      true,
    );
    expect(updateParentAvatarSchema.safeParse({ avatar: DEFAULT_AVATAR_KEY }).success).toBe(false);
    expect(updateParentAvatarSchema.safeParse({}).success).toBe(false);
  });

  it("el alta de un premio NO acepta foto: se añade al editarlo", () => {
    const base = { title: "Ir al cine", childIds: ["hijo-1"], coins: 200 };

    expect(createRewardSchema.safeParse(base).success).toBe(true);
    expect(
      createRewardSchema.safeParse({ ...base, imageUploadKey: "rewards/premio-1/a.jpg" }).success,
    ).toBe(false);
  });

  it("la edición de un premio acepta la foto, y null explícito para borrarla", () => {
    expect(updateRewardSchema.safeParse({ imageUploadKey: "rewards/premio-1/a.jpg" }).success).toBe(
      true,
    );
    expect(updateRewardSchema.safeParse({ imageUploadKey: null }).success).toBe(true);
  });

  it("completar una tarea SIN CUERPO sigue siendo válido", () => {
    // Es como se marcaba una tarea antes de que existiera la evidencia, y como
    // la sigue marcando quien no adjunta foto. Sin esto, añadir la evidencia
    // habría roto a todo el que no la usa: pasó, y estos tests lo cazaron.
    expect(completeTaskSchema.safeParse(undefined).success).toBe(true);
    expect(completeTaskSchema.parse(undefined)).toEqual({});
  });

  it("completar una tarea sin evidencia sigue siendo un cuerpo vacío válido", () => {
    // Es el caso normal, y el que garantiza que la foto no se vuelva un peaje.
    expect(completeTaskSchema.safeParse({}).success).toBe(true);
    expect(completeTaskSchema.safeParse({ evidenceUploadKey: "tasks/t1/evidence/a.jpg" }).success).toBe(
      true,
    );

    // La tarea sale de la ruta, no del cuerpo.
    expect(completeTaskSchema.safeParse({ taskId: "otra-tarea" }).success).toBe(false);
  });
});
