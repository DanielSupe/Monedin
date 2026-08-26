import {
  childParamsSchema,
  createChildSchema,
  createUploadUrlSchema,
  listChildrenQuerySchema,
  updateChildSchema,
  updateOwnChildSchema,
} from "@monedin/contracts";
import type { Router as ExpressRouter } from "express";
import { moduleRouter } from "../../shared/http/module-router.js";
import { requireChild, requireParent } from "../../shared/http/session.js";
import { validate } from "../../shared/http/validate.js";
import * as controller from "./children.controller.js";

/**
 * Monta las rutas del módulo. Cero lógica.
 *
 * El alta es de SOLO CUENTA y el resto exige actor. Esa asimetría es
 * deliberada: `profile-selection` ofrece crear un perfil «cuando el perfil
 * activo es el del padre o cuando aún no se ha elegido ninguno», así que exigir
 * actor dejaría a la rejilla sin poder crear nada. Que un niño con perfil
 * activo NO pueda crear lo comprueba el servicio, porque el nivel de ruta no
 * distingue ese caso.
 */
const children = moduleRouter();

export const childrenRouter: ExpressRouter = children.router;

// --- Solo cuenta acreditada: el alta desde la rejilla -----------------------

children.accountPost(
  "/children",
  validate({ body: createChildSchema }),
  controller.handleCreate,
);

// --- Vista propia del niño --------------------------------------------------
//
// OJO AL ORDEN: estas dos van ANTES que `/children/:childId`. Express casa las
// rutas por orden de registro, así que al revés «me» entraría por `:childId`,
// saltaría `requireParent` y el niño recibiría un 403 en su propia ruta. El
// fallo no es ruidoso —un 403 es perfectamente plausible— y por eso lleva test.

children.get("/children/me", requireChild, controller.handleOwnDetail);

children.patch(
  "/children/me",
  requireChild,
  validate({ body: updateOwnChildSchema }),
  controller.handleOwnUpdate,
);

// Por el mismo orden: «me» tiene que ganarle a `:childId` también aquí.
children.post(
  "/children/me/avatar/upload-url",
  requireChild,
  validate({ body: createUploadUrlSchema }),
  controller.handleOwnAvatarUploadUrl,
);

// --- Gestión del padre ------------------------------------------------------

children.get(
  "/children",
  requireParent,
  validate({ query: listChildrenQuerySchema }),
  controller.handleList,
);

children.get(
  "/children/:childId",
  requireParent,
  validate({ params: childParamsSchema }),
  controller.handleDetail,
);

children.patch(
  "/children/:childId",
  requireParent,
  validate({ params: childParamsSchema, body: updateChildSchema }),
  controller.handleUpdate,
);

children.post(
  "/children/:childId/avatar/upload-url",
  requireParent,
  validate({ params: childParamsSchema, body: createUploadUrlSchema }),
  controller.handleAvatarUploadUrl,
);

children.delete(
  "/children/:childId",
  requireParent,
  validate({ params: childParamsSchema }),
  controller.handleDeactivate,
);
