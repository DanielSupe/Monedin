## 1. Configuración

- [x] 1.1 Declarar `TEST_AWS_ACCESS_KEY_ID` y `TEST_AWS_SECRET_ACCESS_KEY` en
      `apps/api/src/config/env.schema.ts`, obligatorias y sin valor por defecto, junto a las de la
      aplicación y con un comentario que diga por qué están separadas.
- [x] 1.2 Añadirlas a `SECRET_ENV_KEYS` para que su valor no se imprima nunca.
- [x] 1.3 Añadirlas a `.env.example` con `minioadmin`, explicando en la misma frase que desarrollo
      puede apuntar a un almacén real y la batería nunca.
- [x] 1.4 Comprobar que el test que compara el esquema con `.env.example` pasa en los dos sentidos.

## 2. Cliente de la batería

- [x] 2.1 En `apps/api/tests/support/storage.ts`, construir el cliente con las credenciales propias.
- [x] 2.2 Ampliar a TRES el comentario de `testBucket()` que hoy explica dos separaciones, dejando
      las tres escritas en el mismo sitio. Que la tercera no estuviera ahí es la causa del hueco.
- [x] 2.3 Verificar que `apps/api/src/shared/storage/client.ts` y `s3-provider.ts` quedan **sin
      tocar**. Si alguno cambió, se ha colado el entorno de pruebas en el código de producción.

## 3. Entorno local y comprobación

- [x] 3.1 Añadir las dos variables al `.env` local con los valores de MinIO, dejando las de
      desarrollo como estén.
- [x] 3.2 Comprobar que la API **se niega a arrancar** si falta una de las dos, nombrándola y sin
      imprimir su valor. Es el comportamiento buscado, no una molestia.
- [x] 3.3 Correr los tests de `file-storage` contra MinIO **con las credenciales de desarrollo
      apuntando a otro proveedor**, que es el escenario que hoy falla, y verlos pasar.
- [x] 3.4 Correr la batería completa de la API desde `apps/api` y dejarla en verde.
