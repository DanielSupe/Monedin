## Why

CLAUDE.md promete que **los tests van contra MinIO siempre, aunque desarrollo apunte al S3 real**, y
explica por qué: la batería VACÍA su bucket al arrancar, así que equivocarse ahí es la única forma de
perder datos de verdad con este módulo. Para cumplirlo se separó el endpoint —`TEST_S3_ENDPOINT`, que
además no admite vacío porque vacío es como se dice «el S3 de AWS»— y se puso una comprobación de que
el bucket de tests no es el de desarrollo.

**Esa promesa está a medias, y se descubrió al usarla.** El endpoint y el bucket se separaron; las
credenciales no. `apps/api/tests/support/storage.ts` construye su cliente con
`config.AWS_ACCESS_KEY_ID`, que es **el mismo par** que usa el proveedor de producción en
`shared/storage/client.ts`.

La consecuencia apareció en cuanto alguien hizo justo lo que el documento contempla: apuntar el
desarrollo al S3 real. Al poner una llave de AWS de verdad en `.env`, la batería siguió hablando con
MinIO —el endpoint sí estaba separado— pero con las credenciales equivocadas, y toda la suite de
`file-storage` murió con `InvalidAccessKeyId`. No es un test frágil ni un fallo de MinIO: es que
`AWS_ACCESS_KEY_ID` tiene dos dueños con necesidades opuestas.

Conviene decir la otra mitad: **la parte que sí existía funcionó**. Como `TEST_S3_ENDPOINT` no admite
vacío, los tests hablaron con MinIO y se llevaron un 403, en lugar de hablar con AWS y vaciar un
bucket real. El aislamiento evitó el desastre; lo que falta es que además no rompa.

## What Changes

- **Dos variables nuevas**: `TEST_AWS_ACCESS_KEY_ID` y `TEST_AWS_SECRET_ACCESS_KEY`, obligatorias y
  secretas, con el mismo trato que sus equivalentes de producción.
- **El cliente de tests usa las suyas.** `tests/support/storage.ts` deja de leer las credenciales de
  producción. `shared/storage/client.ts` no se toca: sigue siendo el único que construye el
  proveedor real, y sigue sin saber que existe una batería de tests.
- **El aislamiento pasa de dos comprobaciones a TRES**, y las tres se declaran juntas donde ya
  estaban las dos: bucket distinto, endpoint propio y credenciales propias.
- **`.env.example` documenta las dos nuevas** con `minioadmin`, y explica en la misma frase por qué
  están separadas de las de desarrollo.
- **El test que compara el esquema con `.env.example`** las obliga a aparecer en ambos sitios, sin
  escribir una línea: ya falla si se desincronizan en cualquiera de los dos sentidos.

## Capabilities

### Modified Capabilities

- `runtime-configuration`: la plantilla de entorno y el conjunto de variables obligatorias crecen en
  dos, y las dos son secretas. El requisito que enumera qué se considera secreto pasa a cubrirlas.
- `file-storage`: el aislamiento de la batería respecto del almacén real deja de ser una propiedad
  implícita del código y pasa a ser un requisito con sus escenarios, incluido el que este change
  arregla.

### New Capabilities

Ninguna. Esto cierra un hueco de dos capacidades que ya existen.

## Impact

**Código modificado**: `apps/api/src/config/env.schema.ts` (dos variables y su marca de secreto),
`apps/api/tests/support/storage.ts` (el cliente de tests usa las suyas) y `.env.example`.

**Código NO modificado, y es deliberado**: `apps/api/src/shared/storage/client.ts` y
`s3-provider.ts`. El proveedor real no se entera de nada. Un cambio que hiciera al proveedor de
producción saber si está en tests sería exactamente el error opuesto al que este change corrige.

**Base de datos**: ninguna migración.

**API**: ninguna ruta cambia. Ni un contrato.

**Acción manual obligatoria**: cada `.env` existente necesita las dos variables nuevas o la API **no
arranca**, que es el comportamiento correcto y está descrito abajo.

## No incluye

- **Separar las credenciales de la base de datos de tests.** `TEST_DATABASE_URL` ya lleva su usuario
  y su contraseña dentro de la propia URL, así que ese aislamiento ya está completo.
- **Rotar ni gestionar credenciales.** Este change decide de dónde salen, no cómo se custodian.
- **Un doble en memoria para el almacén.** Sigue descartado: lo que hay que probar es que una firma
  rechaza otro tipo de contenido y que `HeadObject` responde 404, y un doble diría que sí a todo.
- **Tocar el proveedor de producción** para que sepa de entornos.
- **Un valor por defecto para las variables nuevas.** Un defecto silencioso es cómo se acaba
  apuntando al almacén equivocado sin enterarse, que es el fallo que este change existe para evitar.
