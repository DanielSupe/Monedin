## 1. La base de datos

- [x] 1.1 `tutorialSeenAt DateTime?` en `User` y en `ChildProfile`, con su comentario de por qué es
      fecha y no booleano.
- [x] 1.2 Generar la migración y **revisarla a mano**: Prisma no conoce los `CHECK` ni el disparador
      que instaló la inicial, y una generada puede llevárselos por delante.
- [x] 1.3 Comprobar que el test de coherencia de límites sigue pasando **sin tocarlo**.

## 2. Los contratos

- [x] 2.1 `tutorialSeen: boolean` en los dos actores. El booleano, no la fecha.
- [x] 2.2 El esquema del `PATCH`, con `seen` y `.strict()`.
- [x] 2.3 Comprobar que el paquete compila solo.

## 3. La API

- [x] 3.1 Repositorio: marcar y desmarcar, para las dos tablas. **Único archivo que toca Prisma.**
- [x] 3.2 Servicio: recibe el actor como primer argumento y **ramifica por rol ahí**, no en el
      controlador. Idempotente: no mueve dinero ni cambia de estado.
- [x] 3.3 El actor que arma `auth.service` incluye el booleano, en las dos ramas.
- [x] 3.4 `PATCH /auth/tutorial` con `moduleRouter()`, exigiendo actor. Una sola ruta para los dos.
- [x] 3.5 Comprobar que `account-only-routes.test.ts` **pasa sin tocarlo**: la lista sigue en cinco.

## 4. Tests de la API

- [x] 4.1 Camino feliz de las dos ramas, y que el estado de la sesión lo refleja después.
- [x] 4.2 Un perfil recién creado lo trae en falso — el padre al registrarse y el hijo al crearse.
- [x] 4.3 **Idempotencia**: marcarlo dos veces deja lo mismo.
- [x] 4.4 **Autorización**: un niño marca el suyo y el de su hermano NO cambia. Comprobar los dos
      lados, o el test pasaría marcándolos todos.
- [x] 4.5 Desmarcar lo devuelve a falso, y solo el del que lo pide.
- [x] 4.6 Sin perfil activo la ruta responde como cualquier otra que exige actor.

## 5. La pieza del sistema

- [x] 5.1 `ui/Spotlight.tsx` sobre las primitivas de Radix, con su velo transparente y el atenuado
      pintado como **sombra proyectada** desde la caja del hueco.
- [x] 5.2 Sin nada que destacar: atenúa todo y centra el panel.
- [x] 5.3 Declarar la **cuarta excepción** en `eslint.config.js`, acotada a ese archivo y con su
      porqué escrito.
- [x] 5.4 Entrada en `ui.html` con y sin algo destacado — sin ella falla el test del catálogo.
- [x] 5.5 Tests de montaje: se anuncia con su título, atrapa el foco, cierra con Escape, y sin
      destacado centra. Y que no importa de `features/` ni de `api/`.

## 6. El recorrido

- [x] 6.1 `features/tutorial/`: el conductor, los dos guiones y el hook que mide el ancla.
- [x] 6.2 Volver a medir al cambiar de paso y al cambiar el tamaño de la ventana.
- [x] 6.3 Un ancla que no aparece **no rompe el paso**: centrado y sin foco.
- [x] 6.4 Los textos y las ilustraciones al catálogo. **Ninguna cifra dentro de una cadena.**
- [x] 6.5 Anclas en `ParentConsole` y `ChildHome`, y cada una monta su recorrido.
- [x] 6.6 Al terminar o saltar, marcar visto y refrescar con `useRefreshSession()`.
- [x] 6.7 «Verlo otra vez» en `/account` y en `/me/settings`.

## 7. Tests del front

- [x] 7.1 Aparece con la marca en falso y **no aparece** con ella en cierto. Los dos casos, o el
      primero pasaría con un recorrido que sale siempre.
- [x] 7.2 Los dos guiones son **distintos**: comparar el primer paso de cada rol entre sí.
- [x] 7.3 Avanzar cambia de paso, y el foco se mueve — comparando la posición entre dos pasos.
- [x] 7.4 Saltar **marca visto** y cierra.
- [x] 7.5 Un paso sin ancla se muestra centrado en vez de dejar el recorrido en blanco.

## 8. Hacer cumplir

- [x] 8.1 **Inyectar las violaciones**, y las cinco tienen que caer: el recorrido saliendo con la
      marca en cierto; saltar sin marcar; el foco quieto entre pasos; un paso sin ancla en blanco; y
      un niño marcando el de su hermano.
- [x] 8.2 `pnpm lint` y `pnpm typecheck` de los dos paquetes.
- [x] 8.3 La batería del web, y la de la API **sola y una sola pasada**.

## 9. Lo que ningún test cubre

- [ ] 9.1 **Abrir la aplicación** con una cuenta nueva: entrar al perfil del padre y al de un hijo,
      ver que sale una vez y no vuelve, y que el foco cae sobre lo que dice.
- [ ] 9.2 Estrechar la ventana y comprobar que el foco sigue cuadrando.
- [ ] 9.3 Con **movimiento reducido**: sin transiciones entre pasos.

## 10. Documentar

- [x] 10.1 `config.yaml`: la superficie nueva y la cuarta excepción de estilo en línea.
- [x] 10.2 `CLAUDE.md` con lo que salga que valga para el siguiente.
