## 1. La talla del botón

- [x] 1.1 `buttonClasses` acepta talla, y `Button` la expone como prop. Las medidas, de tokens.
- [x] 1.2 Entrada en `ui.html` con las dos tallas — sin ella falla el test del catálogo.
- [x] 1.3 Test de que las dos tallas se distinguen **entre sí**, y de que el enlace pide la misma.

## 2. Los textos

- [x] 2.1 Los del flujo, los de las maquetas y los del cierre, al catálogo. **Ninguna cifra dentro
      de una cadena** — hay un test que lo caza.
- [x] 2.2 Retirar los de las tres tarjetas que el flujo sustituye, y comprobar que no los usa nadie.

## 3. El héroe y las órbitas

- [x] 3.1 Token para el escenario de las órbitas, y usarlo en `Orbits.tsx`. **Sin tocar los radios**:
      ampliar la excepción de estilo en línea es lo que este change no puede hacer.
- [x] 3.2 Jerarquía del héroe y la acción principal en su talla nueva.
- [x] 3.3 Comprobar que `Orbits` sigue parándose con movimiento reducido.

## 4. Cómo funciona

- [x] 4.1 `HowItWorks.tsx`: cuatro pasos en orden, con conectores, apilados en estrecho.
- [x] 4.2 Retirar `Promises`: el flujo lo sustituye, no convive con él.
- [x] 4.3 Test de que los cuatro están **en orden** y de que aprobar va entre la tarea y las monedas.
      Comprobar solo que están dejaría pasar cualquier orden.

## 5. La app por dentro

- [x] 5.1 `AppPreview.tsx`: dos maquetas con `Card`, `Coins`, `Badge` y `Avatar`, cada una con su
      `data-scale` real.
- [x] 5.2 Se anuncian como ejemplos: sin eso se oyen como el saldo de alguien.
- [x] 5.3 Ajustar el test de `[data-scale]` para que mire la RAÍZ, con su porqué escrito. Ver la
      decisión 3 del design.
- [x] 5.4 Test de que cada maqueta lleva la escala de su audiencia, comparando las dos entre sí.

## 6. El cierre y el ritmo

- [x] 6.1 `FinalCta.tsx` en `[data-surface="brand"]`, con la acción principal y sin argumentar.
- [x] 6.2 Alternar superficies entre secciones. Ningún color nuevo.
- [x] 6.3 Test de que la acción principal está arriba **y** abajo, y que las dos llevan al registro.

## 7. Hacer cumplir

- [x] 7.1 **Inyectar las violaciones**, y las cuatro tienen que caer: el flujo desordenado; una
      maqueta sin su escala; las dos tallas del botón iguales; y el cierre sin acción.
- [x] 7.2 `pnpm lint` y `pnpm typecheck` del web, y su batería. En serie si la máquina está cargada.
- [x] 7.3 Comprobar que la API no se toca antes de saltarse su batería.

## 8. Lo que ningún test cubre

- [ ] 8.1 **Abrir `/welcome`** a ancho de escritorio, de tablet y de móvil: que las órbitas no
      desborden ni se coman el titular, que los cuatro pasos se apilen bien y que las maquetas no
      obliguen a desplazar de lado.
- [ ] 8.2 Con **movimiento reducido**: órbitas paradas y titular completo desde el primer pintado.

## 9. Documentar

- [ ] 9.1 `config.yaml` y `CLAUDE.md` con lo que salga que valga para el siguiente.
