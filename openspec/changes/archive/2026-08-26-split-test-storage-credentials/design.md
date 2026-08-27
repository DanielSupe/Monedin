## Context

Ver `proposal.md` — Why.

Lo que hace falta saber del código actual:

- `apps/api/src/shared/storage/client.ts` construye el proveedor real leyendo `S3_*` más
  `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` de la configuración validada.
- `apps/api/tests/support/storage.ts` construye **su propio** `S3Client` —ya no reutiliza el del
  proveedor— con `TEST_S3_ENDPOINT` y `TEST_S3_BUCKET_NAME` propios, pero con las credenciales de
  producción.
- `testBucket()` ya documenta «las DOS comprobaciones». Este change las convierte en tres.
- Hay un test que compara el esquema con `.env.example` en ambos sentidos, así que añadir la variable
  en un solo sitio falla solo.

## Goals / Non-Goals

**Goals:**

- Que cambiar la configuración de desarrollo **no pueda** afectar a dónde se autentican los tests.
- Que la tercera separación quede escrita junto a las otras dos, y no solo en el commit.
- Que el arranque falle claro si falta una credencial, en vez de caer hacia la de producción.

**Non-Goals:**

- Enseñar al proveedor de producción qué es un test.
- Resolver cómo se custodian las credenciales.

## Decisions

### 1. Dos variables nuevas, no un prefijo ni un perfil

**Elegido**: `TEST_AWS_ACCESS_KEY_ID` y `TEST_AWS_SECRET_ACCESS_KEY`, con el mismo tratamiento que sus
equivalentes: obligatorias, secretas, sin valor por defecto.

**Por qué**: es la forma que el proyecto ya eligió para el endpoint y el bucket. `TEST_S3_ENDPOINT`
existe al lado de `S3_ENDPOINT`, y `TEST_S3_BUCKET_NAME` al lado de `S3_BUCKET_NAME`. Una tercera
separación con otra gramática obligaría a explicar por qué esta se hace distinta.

**Descartado — un perfil de credenciales del SDK de AWS**: mueve la decisión a un archivo fuera del
repositorio y rompe la regla de que la configuración se declara en un solo esquema validado.

**Descartado — que la batería use `AWS_*` cuando `TEST_*` no esté**: un respaldo silencioso es
exactamente el fallo que se está corrigiendo. Volvería a acoplar las dos configuraciones y solo se
notaría el día que alguien apunte desarrollo a un almacén real, que es hoy.

### 2. Sin valor por defecto, aunque el valor local sea siempre el mismo

`minioadmin` es lo que vale en toda máquina de desarrollo, así que tienta ponerlo por defecto.

**No se hace**, por la regla del proyecto: no se añaden valores por defecto silenciosos para
variables que en producción son obligatorias. Un defecto que tapa una variable ausente es cómo se
acaba apuntando al almacén equivocado sin enterarse — literalmente el fallo que este change corrige,
en su otra dirección.

El coste está acotado y es el correcto: quien ya tenga un `.env` verá la API **negarse a arrancar**
nombrando las dos variables que faltan. Eso es el comportamiento deseado, no una molestia.

### 3. El proveedor de producción no se toca

`client.ts` y `s3-provider.ts` quedan **exactamente igual**. El cambio vive entero en el esquema, en
`.env.example` y en el soporte de tests.

**Por qué importa decirlo**: la salida perezosa habría sido enseñar a `client.ts` a mirar si está en
tests y elegir credenciales. Eso mete el entorno de pruebas dentro del código de producción, que es
el error opuesto y peor. La frontera se mantiene: el proveedor recibe unas credenciales y no pregunta
de dónde vienen.

### 4. Las tres comprobaciones se declaran juntas

`testBucket()` ya lleva el comentario que explica las dos separaciones y por qué no basta con una.
Ese comentario se amplía a tres en el mismo sitio, y la spec recoge las tres como un solo requisito.

**Por qué**: la razón por la que este hueco existió es que la tercera separación nunca se escribió al
lado de las otras dos. Repartirlas otra vez sería repetir la causa.

```
   Antes                              Después
   ─────                              ───────
   bucket      TEST_S3_BUCKET_NAME    bucket        TEST_S3_BUCKET_NAME
   endpoint    TEST_S3_ENDPOINT       endpoint      TEST_S3_ENDPOINT
   credencial  AWS_ACCESS_KEY_ID  ←   credencial    TEST_AWS_ACCESS_KEY_ID
               compartida con                       propia
               producción
```

## Risks / Trade-offs

- **Toda máquina con un `.env` existente deja de arrancar hasta actualizarlo** → Es el
  comportamiento buscado y no un efecto colateral: la alternativa era un respaldo silencioso. El
  mensaje de arranque nombra las dos variables, y `.env.example` trae los valores locales.
- **Alguien copia las credenciales de producción en las de test para «que pase»** → No se puede
  impedir desde el código, pero las otras dos separaciones siguen en pie: aunque las credenciales
  fueran las reales, el endpoint de la batería no admite vacío y el bucket tiene que ser distinto.
  Es justamente el valor de que sean tres y no una.

## Migration Plan

1. Declarar las dos variables en el esquema y marcarlas como secretas.
2. Añadirlas a `.env.example` con `minioadmin`, junto a las de desarrollo y con la explicación.
3. Cambiar el cliente de tests para que use las suyas, y ampliar a tres el comentario de
   `testBucket()`.
4. Actualizar el `.env` local.
5. Correr los tests de almacenamiento y comprobar que pasan con desarrollo apuntando a otro sitio.

**Vuelta atrás**: revertir el change y quitar las dos variables del `.env`. No hay estado persistido
ni migración.

## Open Questions

Ninguna.
