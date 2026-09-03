## 1. Contratos

- [x] 1.1 En `packages/contracts`: esquema del movimiento —importe, saldo resultante, razón, momento,
      y de dónde vino— más la query del listado y su página con `pageOf`.
- [x] 1.2 La query del niño **sin ningún identificador** y `.strict()`: ahí está la garantía de que no
      puede pedir el de su hermano. La del padre lleva el suyo en la ruta, no en la query.
- [x] 1.3 Exportarlos y comprobar que el paquete compila solo.

## 2. El módulo de la API

- [x] 2.1 `apps/api/src/modules/coins/` con sus cinco capas, copiando la plantilla de `health` y el
      patrón de listados de `children`.
- [x] 2.2 `coins.repository.ts`: **único** archivo que toca Prisma. Cuenta y lee en la MISMA
      transacción, y su `orderBy` lleva el identificador como desempate — aprobar un reparto escribe
      varias filas en el mismo instante.
- [x] 2.3 `coins.service.ts`: recibe el actor como primer argumento y comprueba la propiedad. Un hijo
      ajeno es **404 y no 403**.
- [x] 2.4 `coins.controller.ts`: parsea y serializa, cero autorización.
- [x] 2.5 `coins.routes.ts` con `moduleRouter()`: `GET /children/me/coins` con `requireChild` y
      `GET /children/:childId/coins` con `requireParent`. Solo lectura.
- [x] 2.6 Montarlo, y comprobar que el orden de las rutas no choca con `/children/:childId`.

## 3. Tests de la API

- [x] 3.1 Camino feliz de las dos rutas.
- [x] 3.2 **Autorización**: un niño no lee el de su hermano —y su query rechaza cualquier parámetro
      con 422—, y un padre no lee el de un hijo ajeno, que responde 404.
- [x] 3.3 Paginación: metadatos correctos, `pageSize` por encima del máximo es 422, página posterior
      a la última da lista vacía, y **dos movimientos del mismo instante salen en orden estable** sin
      repetirse ni perderse.
- [x] 3.4 Que el saldo resultante que devuelve cada fila es el que la fila guardó, no uno calculado.

## 4. El front

- [x] 4.1 Cliente y hooks, con las claves de consulta e invalidación que correspondan: aprobar una
      tarea o un canje **cambia el historial**, así que su clave entra donde ya se invalida el saldo.
- [x] 4.2 Pantalla del niño, alcanzable **desde su saldo** y no como un quinto destino.
- [x] 4.3 Pantalla del padre, alcanzable desde el saldo de cada hijo.
- [x] 4.4 Cada fila dice qué pasó, cuánto y con qué saldo quedó. Ninguna pantalla suma nada.
- [x] 4.5 Acreditar y descontar se distinguen por **texto y tono**, no solo por el signo. Un descuento
      no va en peligro: es el niño gastándose sus monedas, que es lo que el producto enseña.
- [x] 4.6 Los tres estados —cargando, vacío, error— con las piezas del sistema.

## 5. Hacer cumplir

- [x] 5.1 Test de front: una fila que acredita y otra que descuenta se distinguen **comparando sus
      tonos entre sí**, no comprobando que ambas aparecen.
- [x] 5.2 Test de que la pantalla enseña el saldo que viene en la fila, y no uno acumulado — con un
      caso donde acumular daría un número DISTINTO, o el test no prueba nada.
- [x] 5.3 Test de que se llega al historial desde el saldo, en los dos roles.
- [x] 5.4 **Inyectar las violaciones**: mismo tono en los dos signos, y sumar en el cliente. Las dos
      tienen que caer. Toda sustitución con `assert`.
- [x] 5.5 `pnpm lint` del web ANTES de la batería.
- [x] 5.6 La batería de la API **sola y una sola pasada** —son 14 minutos y dos suites sobre la misma
      base se pisan—, y después el resto.

## 6. Documentar

- [x] 6.1 Actualizar `config.yaml`: el historial ya se expone, y decir que el ajuste manual sigue sin
      exponerse **con lo que costaría** — es lo que este change deja mejor que lo encontró.
- [x] 6.2 Anotar en `CLAUDE.md` lo que salga que valga para el siguiente.
