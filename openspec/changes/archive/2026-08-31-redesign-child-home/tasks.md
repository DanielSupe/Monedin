> El grupo 1 no cambia ni un píxel, y va primero a propósito: si se mezcla con el rediseño, no hay
> forma de saber si algo se movió al mudarlo o al vestirlo.

## 1. Sacar las pantallas del archivo de ruta

- [x] 1.1 `ChildHome` a `features/children/`, tal cual está.
- [x] 1.2 `ParentHome` a `features/auth/`, **tal cual está**: se muda el archivo, no el aspecto.
- [x] 1.3 `routes/index.tsx` queda en lo que su nombre dice: guarda, y elegir por rol.
- [x] 1.4 `LeaveProfile` acompaña a quien lo use; hoy lo usan los dos.
- [x] 1.5 **Comprobar que los dos inicios se ven exactamente igual que antes.** Es todo lo que este
      grupo tiene que demostrar.

## 2. El inicio del niño, vestido

- [x] 2.1 El saldo primero y con `Coins size="hero"`, que bajo la escala del niño son 4 rem. La cifra
      no se escribe a mano: la pieza formatea, alinea y anuncia «120 monedas».
- [x] 2.2 Los cuatro destinos pasan a ser tarjetas en rejilla, con su glifo. **Un solo elemento
      interactivo por tarjeta**, como las teselas de la rejilla de perfiles.
- [x] 2.3 Salir a la rejilla deja de ser un botón suelto al final.
- [x] 2.4 Cero estilos en línea, cero colores literales, cero valores arbitrarios.
- [x] 2.5 Los textos incrustados —«Hola, {nombre}», «Tienes N monedas»— al catálogo de
      `lib/messages.ts`.

## 3. La deuda declarada

- [x] 3.1 Estrechar `features/children` a los archivos que siguen sin vestir, como se hizo con
      `features/auth`. Ajustar el `toHaveLength` y explicarse ahí.
- [x] 3.2 `routes/` **no sale todavía**: quedan sus otros archivos. `index.tsx` ya no tiene estilos
      en línea. **Al estrechar `features/auth` quedaron destapados los dos archivos mudados**, y sus
      estilos se tradujeron a utilidades una a una —`mt-4`, `list-none p-0 grid gap-2`—: traducir no
      es vestir, y así la deuda no engorda con código que solo cambió de sitio.
- [x] 3.3 Comprobar que los tests de estilo cazan un color literal metido a mano en la pantalla nueva.

## 4. Tests

- [x] 4.1 Un niño en `/` ve su inicio; un padre ve el suyo. Ninguno ve el del otro.
- [x] 4.2 El saldo se anuncia con su unidad, no como un número suelto.
- [x] 4.3 Los cuatro destinos llevan a donde dicen.
- [x] 4.4 Cada tarjeta es **una sola cosa interactiva**.
- [x] 4.5 Comprobar que fallan de verdad inyectando una violación, y no pasan por vacíos.

## 5. Cierre

- [x] 5.1 **Abrir la aplicación** con Mateo —PIN `1234`— y recorrer los cuatro destinos desde el
      inicio.
- [x] 5.2 **Abrir el inicio del padre** y confirmar que no cambió nada al mudarlo.
- [x] 5.3 A **390×844**: el saldo a 4 rem más cuatro tarjetas es lo que hay que medir. Que no
      desborde de lado.
- [x] 5.4 Medido: de las cinco pantallas del niño, el inicio, los premios y los canjes **ya caben**;
      siguen desbordando `/me/tasks` y `/me/settings`. El parche del marco no se puede retirar
      todavía. Y `/me/settings` **no lo reclama ningún change planificado**: ver el design.
- [x] 5.5 Verificación completa: `pnpm turbo run lint typecheck test build --force --concurrency=1`,
      con Docker arriba, **sola y sin nada más corriendo**.
- [x] 5.6 Actualizar `README.md`, `openspec/config.yaml` y `CLAUDE.md`.
- [x] 5.7 Si alguna decisión del design resultó equivocada al implementarla, **actualizar el design y
      decirlo**.
