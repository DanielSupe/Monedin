> El grupo 1 no se ve. Va primero porque todo lo demás se apoya en él: sin la rampa, cualquier trazo
> sobre el panel tiene que ser blanco, negro o del color exacto del fondo.

## 1. El color y la rampa

- [x] 1.1 **La superficie pasa a índigo profundo y el ámbar a acento.** Es la corrección grande del
      change, y llegó a mitad: empezó como acabado del panel ámbar. Ver la decisión 1 del design.
- [x] 1.2 Rampa índigo completa: pasos oscuros para pintar y claros para lo que va encima. En la capa
      1, que **no genera utilidades**.
- [x] 1.3 Los semánticos cambian de VALOR y no de nombre. Que un cambio de color así no tocara un
      solo punto de uso es la prueba de que la capa semántica estaba bien puesta.
- [x] 1.4 Retirar los primitivos ámbar y los neutros cálidos que se añadieron para el panel: ya no
      hacen falta.

## 2. Los neutros, por superficie

- [x] 2.1 Sobre oscuro la tinta se **invierte**, y no basta: `--color-surface-raised` también se
      reasigna, o el campo queda blanco con texto claro dentro. Ver la decisión 2 del design.
- [x] 2.2 `--shadow-card` y `--shadow-raised` más profundas: sobre un fondo oscuro la sombra clara
      del sistema no separa nada.
- [x] 2.4 **El camino de vuelta**: `[data-surface="default"]`, que declara el componente que pinta su
      propio fondo claro. Ver la decisión 3 bis.
- [x] 2.3 Comentar **por qué** el bloque existe, con la analogía de la escala: un token no cambia de
      significado, cambia de valor según dónde está.

## 3. El botón

- [x] 3.1 Variante `contrast` en `Button`: la acción principal cuando el fondo ya es de marca. El
      nombre dice el **papel**, no el color, como las otras cuatro.
- [x] 3.2 El acceso y el registro la piden. El primario sigue siendo el primario donde el fondo es
      claro.
- [x] 3.3 Al catálogo vivo. Hay un test que lo exige.

## 4. El acabado del panel

- [x] 4.1 El panel de marca pasa de color plano a **degradado corto** hacia `brand-deep`.
- [x] 4.2 Los paneles usan el radio de una lámina y no el de una tarjeta.
- [x] 4.3 **Rehecha entera**: la órbita pasa a ser la de la puerta pública simplificada —tres
      anillos, sus radios, cuadrados redondeados sin borde y trazas de 1px—, con seis iconos en vez
      de nueve. Ver la decisión 6 del design.
- [x] 4.4 Los radios, comprobados midiendo la distancia de cada pieza al centro: 135, 99 y 63.
      Ver las decisiones 5 y 6 del design, que son las dos veces que me equivoqué con esto.
- [x] 4.5 El campo sobre ámbar, con borde propio: hoy solo lo sostiene la sombra y sobre un fondo
      saturado eso se pierde.

## 5. Cierre

- [x] 5.1 **Abrir el acceso y el registro**, en escritorio y a 390 px.
- [x] 5.2 **Abrir una pantalla del padre y una del niño y comprobar que NO cambió nada.** Es el
      riesgo real de tocar tokens, y no lo cubre ningún test.
- [x] 5.3 El catálogo vivo, para ver las piezas bajo la superficie clara de siempre.
- [x] 5.4 Con **movimiento reducido**: las órbitas quietas y completas. Comprobado en el CSS
      compilado —las seis reglas viven dentro de `@media(prefers-reduced-motion:no-preference)`— y
      con el test que exige que ninguna pieza use la clase sin `motion-safe:`. Nota: en el CSS queda
      además una `.animate-disc` suelta y muerta; la genera el escáner al leer esa cadena en el
      propio archivo de test, no la usa nadie.
- [x] 5.5 Verificación completa: `pnpm turbo run lint typecheck test build --force --concurrency=1`,
      con Docker arriba. Si se corta, **lo que queda detrás no es verde, es desconocido**.
- [x] 5.6 Actualizar `README.md`, `openspec/config.yaml` y `CLAUDE.md`.
- [x] 5.7 Si alguna decisión del design resultó equivocada al implementarla, **actualizar el design y
      decirlo**.
