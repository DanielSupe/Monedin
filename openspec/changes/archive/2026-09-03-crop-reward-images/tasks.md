## 1. Separar la forma del tamaño

- [x] 1.1 `prepareImage` recibe la medida máxima en lugar de deducirla de `forAvatar`. La bandera no
      sobrevive: nombrar una opción por su primer caso de uso es cómo se acaba pasando
      `forAvatar: true` para algo que no lo es.
- [x] 1.2 `ImageUploadField` gana una prop para el tamaño, independiente de `aspect`. Las dos
      constantes siguen siendo `AVATAR_MAX_DIMENSION` y `PHOTO_MAX_DIMENSION`, y ninguna se escribe
      a mano.
- [x] 1.3 Reescribir la cabecera de `ImageUploadField`: hoy afirma lo contrario de lo que hará. Con
      el argumento nuevo y diciendo que la evidencia conserva la decisión original.
- [x] 1.4 Los cuatro puntos de uso siguen compilando y pidiendo lo suyo: avatar recorta y guarda
      pequeño, evidencia no recorta y guarda grande.
- [x] 1.5 Test de que recortar y el tamaño ya no van juntos: una imagen que recorta **sin** ser
      avatar se prepara con la medida de foto. El caso tiene que dar una medida DISTINTA de la del
      avatar, o no distingue nada.

## 2. El premio recorta

- [x] 2.1 `RewardForm` pide recorte cuadrado, conservando la medida de foto.
- [x] 2.2 `RewardCatalog` igual: las dos vías de entrada de una foto de premio recortan, o el
      catálogo acaba con fotos de dos clases según por dónde entraron.
- [x] 2.3 Test de que las dos ofrecen el recortador antes de subir.
- [x] 2.4 Test de que el avatar **sigue** recortando y la evidencia **sigue** sin hacerlo — un cambio
      que arrastrara a los otros dos pasaría desapercibido si solo se mira el premio.

## 3. La caja de la imagen

- [x] 3.1 `RewardImage`: caja de proporción cuadrada, la misma para la foto y para el respaldo.
- [x] 3.2 Una foto vieja de otra proporción se encuadra sin deformarse y **sin reprocesar nada**.
- [x] 3.3 Test de que las dos ramas —con foto y sin ella— producen la misma caja. Comparar las dos
      entre sí, no comprobar que cada una existe.

## 3b. El tamaño de la tesela

- [x] 3b.1 Tope de ancho por tesela, desde un token: con dos columnas y sin tope, en el ancho máximo
      del contenido cada una pasaba de 450px y la foto ocupaba media pantalla.
- [x] 3b.2 Más columnas cuando hay sitio, para que el tope no deje huecos. La decisión de
      `redesign-child-surfaces` era «dos y no tantas como quepan» porque cada columna de más encogía
      la foto; con un tope por tesela la foto tiene ahora también un suelo, así que crecer en ancho
      deja de encogerla.

## 4. Hacer cumplir

- [x] 4.1 **Inyectar las violaciones**, y las tres tienen que caer: el premio subiendo sin recorte; el
      recorte arrastrando otra vez la medida de avatar; y el respaldo con una caja distinta de la de
      la foto. Toda sustitución con `assert`.
- [x] 4.2 `pnpm lint` del web ANTES de la batería.
- [x] 4.3 Batería del web. La de la API no debería hacer falta: este change no la toca — comprobar
      que es cierto antes de saltársela.

## 5. Lo que ningún test cubre

- [x] 5.1 **Abrir la aplicación**: publicar un premio con una foto apaisada, recortarla, y ver la
      rejilla del niño con ese premio junto a otro sin foto y a otro con foto vieja. Que las tres
      teselas midan lo mismo no lo prueba jsdom.

## 6. Documentar

- [x] 6.1 `config.yaml`: qué se recorta y qué no, y por qué son dos decisiones y no una.
- [x] 6.2 `CLAUDE.md`: lo que salga que valga para el siguiente.
