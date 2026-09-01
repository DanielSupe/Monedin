## 1. El escaparate

- [ ] 1.1 Cada premio en una `Card`: su foto, su título, su descripción y su precio con `Coins`.
- [ ] 1.2 **Estrenar `ProgressBar`** cuando no alcanza: `value` el saldo, `max` el precio. Es lo que
      su propia cabecera dice desde `add-design-system`, y hasta hoy solo la usaba el catálogo.
- [ ] 1.3 La cifra de lo que falta **se queda** junto a la barra: la barra dice «estás por aquí» y el
      número dice cuánto exactamente.
- [ ] 1.4 «Ya lo pediste» pasa a ser un `Badge`, no un párrafo. Lo que se ve y lo que se puede hacer
      van juntos.
- [ ] 1.5 El vacío con `EmptyState`; los errores con `Alert`.
- [ ] 1.6 La foto del premio, con medida del sistema en vez de `maxWidth` a mano.
- [ ] 1.7 Cero estilos en línea, cero colores literales, cero valores arbitrarios.

## 2. Los canjes

- [ ] 2.1 Cada canje en una `Card`, con su estado como `Badge`: pendiente neutro, aprobado éxito y
      rechazado **advertencia, no peligro** — nadie hizo nada mal. Ver la decisión 3 del design.
- [ ] 2.2 Las monedas con `Coins`.
- [ ] 2.3 El vacío con `EmptyState`; los errores con `Alert`.
- [ ] 2.4 Sin enlace de «Volver»: el marco del niño ya tiene su barra, como se decidió en
      `redesign-child-tasks`.

## 3. La deuda declarada

- [ ] 3.1 Estrechar `features/rewards` y `features/redemptions` a lo que siga sin vestir, que es del
      padre. Ajustar el `toHaveLength` y explicarse ahí.
- [ ] 3.2 Comprobar que los tests de estilo cazan un color literal en las pantallas nuevas.

## 4. Tests

- [ ] 4.1 Un premio que NO alcanza enseña progreso, y se anuncia con su valor y su meta.
- [ ] 4.2 Un premio que SÍ alcanza ofrece pedirlo y no enseña distancia.
- [ ] 4.3 Un premio ya pedido no ofrece volver a pedirlo.
- [ ] 4.4 Los tres estados de un canje se distinguen.
- [ ] 4.5 Comprobar que fallan de verdad inyectando una violación, y no pasan por vacíos.

## 5. Cierre

- [ ] 5.1 **Abrir la aplicación** con Mateo —PIN `1234`— y mirar el escaparate con **tres saldos**:
      cero, justo el precio y de sobra. `ProgressBar` no se ha usado nunca en producción.
- [ ] 5.2 **Pedir un premio de verdad** y verlo aparecer en los canjes como pendiente.
- [ ] 5.3 **Aprobar y rechazar uno desde el padre**, y ver los dos estados en la pantalla del niño.
- [ ] 5.4 A **390×844**, con varios premios: una barra por fila puede recargar una lista larga.
- [ ] 5.5 Verificación completa: `pnpm turbo run lint typecheck test build --force --concurrency=1`,
      con Docker arriba, **sola y sin nada más corriendo**.
- [ ] 5.6 Actualizar `README.md`, `openspec/config.yaml` y `CLAUDE.md`.
- [ ] 5.7 Si alguna decisión del design resultó equivocada al implementarla, **actualizar el design y
      decirlo**.
