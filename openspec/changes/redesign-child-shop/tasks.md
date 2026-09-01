## 1. El escaparate

- [x] 1.1 Cada premio en una `Card`: su foto, su título, su descripción y su precio con `Coins`.
- [x] 1.2 **Estrenar `ProgressBar`** cuando no alcanza: `value` el saldo, `max` el precio. Es lo que
      su propia cabecera dice desde `add-design-system`, y hasta hoy solo la usaba el catálogo.
- [x] 1.3 La cifra de lo que falta **se queda** junto a la barra: la barra dice «estás por aquí» y el
      número dice cuánto exactamente.
- [x] 1.4 «Ya lo pediste» pasa a ser un `Badge`, no un párrafo. Lo que se ve y lo que se puede hacer
      van juntos.
- [x] 1.5 El vacío con `EmptyState`; los errores con `Alert`.
- [x] 1.6 La foto del premio, con medida del sistema en vez de `maxWidth` a mano.
- [x] 1.7 Cero estilos en línea, cero colores literales, cero valores arbitrarios.

## 2. Los canjes

- [x] 2.1 Cada canje en una `Card`, con su estado como `Badge`: pendiente neutro, aprobado éxito y
      rechazado **advertencia, no peligro** — nadie hizo nada mal. Ver la decisión 3 del design.
- [x] 2.2 Las monedas con `Coins`.
- [x] 2.3 El vacío con `EmptyState`; los errores con `Alert`.
- [x] 2.4 Sin enlace de «Volver»: el marco del niño ya tiene su barra, como se decidió en
      `redesign-child-tasks`.

## 3. La deuda declarada

- [x] 3.1 Estrechar `features/rewards` y `features/redemptions` a lo que siga sin vestir, que es del
      padre. Ajustar el `toHaveLength` y explicarse ahí.
- [x] 3.2 Comprobar que los tests de estilo cazan un color literal en las pantallas nuevas.

## 4. Tests

- [x] 4.1 Un premio que NO alcanza enseña progreso, y se anuncia con su valor y su meta.
- [x] 4.2 Un premio que SÍ alcanza ofrece pedirlo y no enseña distancia.
- [x] 4.3 Un premio ya pedido no ofrece volver a pedirlo.
- [x] 4.4 Los tres estados de un canje se distinguen.
- [x] 4.5 Comprobar que fallan de verdad inyectando una violación, y no pasan por vacíos.

## 5. Cierre

- [x] 5.1 **Abrir la aplicación** con Mateo —PIN `1234`— y mirar el escaparate con **tres saldos**:
      cero, justo el precio y de sobra. `ProgressBar` no se ha usado nunca en producción.
- [x] 5.2 **Pedir un premio de verdad** y verlo aparecer en los canjes como pendiente.
- [x] 5.3 **Aprobar y rechazar uno desde el padre**, y ver los dos estados en la pantalla del niño.
- [x] 5.4 A **390×844**, con varios premios: una barra por fila puede recargar una lista larga.
- [x] 5.5 Verificación completa, en **dos pasadas y por un motivo**: la primera murió con un
      `Hook timed out` en un test que figura con 27.232.181 ms —7,5 horas— porque la máquina se
      suspendió a mitad. No era un defecto, pero tampoco se da por bueno: se relanzó la API sola
      (565/565) y después los tres paquetes restantes (8/8). Es lo mismo que `CLAUDE.md` ya anota de
      una pasada de 9 h 05.
- [x] 5.6 Actualizar `README.md`, `openspec/config.yaml` y `CLAUDE.md`.
- [x] 5.7 Si alguna decisión del design resultó equivocada al implementarla, **actualizar el design y
      decirlo**.
