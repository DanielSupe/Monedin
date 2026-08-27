> Orden no negociable: el cambio de destino de las guardas va **el último** (grupo 6). Mandar a todo
> el mundo a una página que aún no existe o no está bien es peor que no tener landing. Ver el plan de
> migración del design.

## 1. La pieza de marca

- [x] 1.1 `apps/web/src/ui/Logo.tsx`: marca tipográfica con un símbolo de moneda en SVG propio,
      construida solo con tokens. Con nombre accesible: se anuncia como el producto, no como una
      imagen sin descripción.
- [x] 1.2 Exportarla desde `ui/index.ts` y añadir su entrada al catálogo vivo. Sin eso falla el test
      que enumera lo exportado.
- [x] 1.3 Test de la pieza: rinde, tiene nombre accesible y no importa nada de `features/` ni de
      `api/`.

## 2. Los dos marcos la adoptan

- [x] 2.1 `ParentShell` y `ChildShell` usan `Logo` donde hoy hay un `<span>` con el título.
- [x] 2.2 Test: los dos marcos rinden la marca desde la pieza, no como texto suelto.
- [x] 2.3 Comprobar que los tests de marcos de `add-app-shell` siguen pasando: buscan la navegación
      por su etiqueta, no por el título, así que no deberían moverse.

## 3. Los dos hooks

- [x] 3.1 `use-count-up.ts`: cuenta de 0 al valor dado con suavizado. **Consulta
      `prefers-reduced-motion` y devuelve el valor final de entrada**, sin animar.
- [x] 3.2 `use-typewriter.ts`: escribe carácter a carácter a velocidad configurable. Misma regla:
      con movimiento reducido devuelve el texto completo desde el primer render.
- [x] 3.3 Tests de los dos, **incluido el caso de movimiento reducido**, que es donde la regla se
      rompe sola si a alguien se le olvida. Ninguna regla de CSS puede arreglar esto: es estado de
      React y tiene que saberlo el hook.

## 4. La página

- [x] 4.1 `features/landing/` con la estructura: cabecera, héroe a la izquierda, visualización a la
      derecha, franja de promesas abajo.
- [x] 4.2 Las tres órbitas concéntricas, a distinta velocidad y sentido, con el saldo y su cuenta
      animada en el centro. Lo que orbita es el ciclo —tareas, premios, perfiles—, no gente.
- [x] 4.3 **Entrar y Empezar como acciones de primer nivel.** No una principal y un enlace pequeño:
      la mitad de quien llegue aquí ya es usuario con la sesión caducada.
- [x] 4.4 La franja de las tres promesas. Nada de logos de socios: no los hay, e inventarlos sería
      poner respaldos falsos en una página pública.
- [x] 4.5 Todo el texto al catálogo de mensajes. Ni una frase incrustada.
- [x] 4.6 Con movimiento reducido, las órbitas quedan **quietas en posición estable**, no congeladas
      a mitad de giro.
- [x] 4.7 Ruta `/welcome`, pública: sin guarda de ningún tipo. Cableado fino, como el resto.
- [x] 4.8 Tests: el titular, las tres promesas y las dos acciones se rinden; la ruta se ve con sesión
      y sin ella; y **no se hace ninguna petición de datos**.

## 5. Comprobación antes de mandar tráfico

- [x] 5.1 Abrir `/welcome` a mano, sin sesión y con ella, y comprobar que se entiende qué hace el
      producto sin tocar nada.
- [x] 5.2 En 390×844: que nada se salga de lado y que los objetivos de toque aguanten.
- [x] 5.3 Con movimiento reducido activado en el sistema: titular completo, número en su valor final,
      órbitas quietas.
- [x] 5.4 Comprobar que el logo se ve igual en la landing y en los dos marcos.

## 6. Y solo entonces, redirigir hacia ella

- [x] 6.1 En `guards.ts`, el destino de «sin sesión» pasa de `/sign-in` a `/welcome`. **Una
      constante**, no una excepción por ruta.
- [x] 6.2 Actualizar las dos aserciones de `tests/app/navigation.test.tsx` que hoy esperan
      `/sign-in`. La aserción sigue al comportamiento decidido, no al revés.
- [x] 6.3 Test: sin sesión, `/`, `/tasks`, `/me/tasks` y `/profiles` acaban en `/welcome`. Con
      sesión, **no**: quien ya entró no vuelve a la puerta.
- [x] 6.4 Test del camino de vuelta: desde la landing se llega a `/sign-in` y se puede entrar. Es el
      camino de quien ya es usuario, así que si se rompe, se quedan fuera.

## 7. Cierre

- [x] 7.1 Verificación completa. `pnpm verify` no cabe en esta máquina: usar
      `pnpm turbo run lint typecheck test build --force --concurrency=1`, con Docker arriba. Y si se
      corta por un fallo, **lo que queda detrás no es verde, es desconocido**: correr los paquetes
      restantes por separado.
- [x] 7.2 Repaso manual del recorrido completo: sin sesión teclear `/`, acabar en la landing, pulsar
      Entrar, entrar con la semilla y llegar al inicio.
- [x] 7.3 Comprobar que **ninguna pantalla existente cambió de aspecto** salvo el título de los dos
      marcos, que ahora es la pieza.
- [x] 7.4 Actualizar `README.md`, la sección de front de `openspec/config.yaml` y `CLAUDE.md`.
- [x] 7.5 Si alguna decisión del design resultó equivocada al implementarla, **actualizar el design y
      decirlo**.
