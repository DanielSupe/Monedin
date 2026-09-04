## 1. Separar la forma del tamaño

- [ ] 1.1 `prepareImage` recibe la medida máxima en lugar de deducirla de `forAvatar`. La bandera no
      sobrevive: nombrar una opción por su primer caso de uso es cómo se acaba pasando
      `forAvatar: true` para algo que no lo es.
- [ ] 1.2 `ImageUploadField` gana una prop para el tamaño, independiente de `aspect`. Las dos
      constantes siguen siendo `AVATAR_MAX_DIMENSION` y `PHOTO_MAX_DIMENSION`, y ninguna se escribe
      a mano.
- [ ] 1.3 Reescribir la cabecera de `ImageUploadField`: hoy afirma lo contrario de lo que hará. Con
      el argumento nuevo y diciendo que la evidencia conserva la decisión original.
- [ ] 1.4 Los cuatro puntos de uso siguen compilando y pidiendo lo suyo: avatar recorta y guarda
      pequeño, evidencia no recorta y guarda grande.
- [ ] 1.5 Test de que recortar y el tamaño ya no van juntos: una imagen que recorta **sin** ser
      avatar se prepara con la medida de foto. El caso tiene que dar una medida DISTINTA de la del
      avatar, o no distingue nada.

## 2. El premio recorta

- [ ] 2.1 `RewardForm` pide recorte cuadrado, conservando la medida de foto.
- [ ] 2.2 `RewardCatalog` igual: las dos vías de entrada de una foto de premio recortan, o el
      catálogo acaba con fotos de dos clases según por dónde entraron.
- [ ] 2.3 Test de que las dos ofrecen el recortador antes de subir.
- [ ] 2.4 Test de que el avatar **sigue** recortando y la evidencia **sigue** sin hacerlo — un cambio
      que arrastrara a los otros dos pasaría desapercibido si solo se mira el premio.

## 3. La caja de la imagen

- [ ] 3.1 `RewardImage`: caja de proporción cuadrada, la misma para la foto y para el respaldo.
- [ ] 3.2 Una foto vieja de otra proporción se encuadra sin deformarse y **sin reprocesar nada**.
- [ ] 3.3 Test de que las dos ramas —con foto y sin ella— producen la misma caja. Comparar las dos
      entre sí, no comprobar que cada una existe.

## 4. Hacer cumplir

- [ ] 4.1 **Inyectar las violaciones**, y las tres tienen que caer: el premio subiendo sin recorte; el
      recorte arrastrando otra vez la medida de avatar; y el respaldo con una caja distinta de la de
      la foto. Toda sustitución con `assert`.
- [ ] 4.2 `pnpm lint` del web ANTES de la batería.
- [ ] 4.3 Batería del web. La de la API no debería hacer falta: este change no la toca — comprobar
      que es cierto antes de saltársela.

## 5. Lo que ningún test cubre

- [ ] 5.1 **Abrir la aplicación**: publicar un premio con una foto apaisada, recortarla, y ver la
      rejilla del niño con ese premio junto a otro sin foto y a otro con foto vieja. Que las tres
      teselas midan lo mismo no lo prueba jsdom.

## 6. Documentar

- [ ] 6.1 `config.yaml`: qué se recorta y qué no, y por qué son dos decisiones y no una.
- [ ] 6.2 `CLAUDE.md`: lo que salga que valga para el siguiente.
