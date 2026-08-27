## 1. La forma

- [x] 1.1 `shape?: "circle" | "rounded"` en `Avatar`, con `circle` por defecto. La forma es una
      opción de la pieza y **no** una clase desde fuera: `cx` no fusiona utilidades, así que dos
      radios los resuelve el orden del CSS generado. Ver la decisión 1 del design.
- [x] 1.2 Comprobar que las cinco pantallas que ya usan `Avatar` **no cambian**: el valor por defecto
      es el de hoy.
- [x] 1.3 La forma nueva, al catálogo vivo.

## 2. La rejilla

- [x] 2.1 Las teselas piden `rounded`, y la talla sube de 8 rem a 9 rem.
- [x] 2.2 La tesela de «Agregar perfil» y la de un perfil bloqueado, igual: son la misma fila.
- [x] 2.3 **Medir el móvil**: a 390 px tienen que seguir cabiendo **dos por fila**. El margen es
      estrecho, así que se mide y no se deduce.

## 3. La corona del adulto

- [x] 3.1 Distintivo en una esquina de la tesela del padre, a partir del `familyRole` que la rejilla
      ya recibe. **Cero cambios en la API.**
- [x] 3.2 Con **nombre accesible**: un icono suelto hay que aprenderlo, y quien no ve la pantalla no
      lo aprende nunca.
- [x] 3.3 El texto, al catálogo de `lib/messages.ts`.
- [x] 3.4 Comprobar que las teselas quedan **a la misma altura**: la corona va en la esquina
      precisamente para no ocupar línea.

## 4. El realce al señalar

- [x] 4.1 La tesela crece un poco con el puntero encima, bajo `motion-safe`.
- [x] 4.2 Un realce que **no es movimiento** —el fondo— encendido en los dos casos, para que con
      movimiento reducido la tesela siga respondiendo.
- [x] 4.3 **No vale bajar la duración**: el bloque del sistema pone 1 ms, y eso convierte el
      crecimiento en un salto instantáneo, que es peor para quien pidió no ver movimiento. Ver la
      decisión 3 del design y la lección de `add-landing-page`.

## 5. Tests

- [x] 5.1 `Avatar` sin forma sigue siendo redondo; con `rounded` no lo es.
- [x] 5.2 La tesela del padre se anuncia con su rol; las de los hijos no.
- [x] 5.3 El crecimiento está bajo `motion-safe` y el realce de color no.
- [x] 5.4 Comprobar que los tres fallan de verdad inyectando una violación, y no pasan por vacíos.

## 6. Cierre

- [x] 6.1 **Abrir la aplicación**: la rejilla en escritorio y en móvil, con el modo administrar
      encendido y apagado, y un perfil bloqueado.
- [x] 6.2 Pasar el ratón por encima y ver el crecimiento; repetirlo con movimiento reducido activado
      en el navegador y comprobar que **no se mueve** y sigue respondiendo.
- [x] 6.3 Que las demás pantallas que usan `Avatar` sigan con el círculo.
- [x] 6.4 Verificación completa: `pnpm turbo run lint typecheck test build --force --concurrency=1`,
      con Docker arriba. Si se corta, **lo que queda detrás no es verde, es desconocido**.
- [x] 6.5 Actualizar `README.md`, `openspec/config.yaml` y `CLAUDE.md`.
- [x] 6.6 Si alguna decisión del design resultó equivocada al implementarla, **actualizar el design y
      decirlo**.
- [x] 6.7 Dejar anotado que **el saldo en la rejilla se descartó a conciencia**, con su motivo, para
      que no vuelva a proponerse sin argumento nuevo.
