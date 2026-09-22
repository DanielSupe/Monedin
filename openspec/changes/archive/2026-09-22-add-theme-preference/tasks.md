# Tareas

## 1. El dato

- [x] 1.1 Enumerado `ThemePreference` con tres valores y columna `themePreference` en `User` y en
      `ChildProfile`, con `SYSTEM` por defecto. Dos columnas y no una tabla aparte: hoy hay UNA
      preferencia, y una tabla sería una junta más en cada lectura de sesión.
- [x] 1.2 Migración, y repasarla a mano antes de darla por buena: Prisma no conoce las restricciones
      que instaló la migración inicial y una generada automáticamente puede llevárselas por delante.
- [x] 1.3 Comprobar que el valor por defecto deja el comportamiento EXACTAMENTE como está hoy. Una
      migración que cambia lo que ve alguien que no pidió nada es una regresión.

## 2. El contrato

- [x] 2.1 `themePreferenceSchema` con los tres valores, y `theme` en los DOS actores.
- [x] 2.2 `updateThemeSchema`, estricto: un campo desconocido es 422 y no algo que se ignora.
- [x] 2.3 Arreglar los actores de prueba que rompa el campo nuevo, y elegir a conciencia el valor por
      defecto del ayudante compartido: `SYSTEM`, porque el caso común de un test es alguien que no ha
      tocado nada. Es lo mismo que costó `tutorialSeen`, y lo que hay que mirar.

## 3. La API

- [x] 3.1 `PATCH /auth/theme`, calcada de `/auth/tutorial`: mismo verbo —es un campo de estado del
      perfil— y una sola ruta para los dos roles.
- [x] 3.2 La rama por rol en el SERVICIO, no en el controlador. Un `if` sobre el rol en un controlador
      está en la capa equivocada.
- [x] 3.3 Exige actor: NO entra en la lista cerrada de rutas de solo cuenta, que sigue en cinco.
- [x] 3.4 El estado de la sesión devuelve `theme` en los dos actores y en ninguno cuando no hay perfil.
- [x] 3.5 Tests: el camino feliz de cada rol, que sin actor es 401, y que un valor inventado es 422.

## 4. El marco

- [x] 4.1 Estampar `data-theme` en la RAÍZ del documento, no en el contenedor del marco: los diálogos
      y el velo del recorrido salen por un portal y se quedarían con el tema contrario.
- [x] 4.2 Con «seguir al sistema» no se escribe ningún atributo: la ausencia es lo que deja mandar al
      dispositivo.
- [x] 4.3 Limpiar el atributo al salir del perfil, o la rejilla heredaría el tema del último que entró.
- [x] 4.4 Test: cada preferencia estampa lo suyo, y cambiar de perfil cambia el tema sin recargar.

## 5. El control

- [x] 5.1 Un solo control en la cabecera de los dos marcos, a la derecha, que recorre los tres estados.
- [x] 5.2 Su nombre dice el estado ACTUAL y cambia con él, como el de contraer el lateral.
- [x] 5.3 NO aparece en el marco de entrada: allí no hay actor y no habría dónde guardar.
- [x] 5.4 Test: los tres estados en ciclo, el nombre que cambia, y que no está antes de elegir perfil.

## 6. Cierre

- [x] 6.1 Abrir los dos marcos y recorrer el ciclo entero mirando que no haya destello al cargar.
      **Comprobado**: el ciclo entero en el navegador —oscuro → sin atributo → claro → oscuro— y que
      al SALIR del perfil el atributo se limpia, así que la rejilla no hereda el tema del último que
      entró. Y en la base: solo el perfil que lo eligió cambió; su hermana y su madre siguen en
      `SYSTEM`.
- [x] 6.2 Comprobar que un diálogo abierto respeta el tema, que es lo que obliga a estampar en la raíz.
      El atributo va en `<html>`, así que un portal al final del documento lo hereda por construcción.
      Verificado además inyectando la violación contraria —escribir `light` en vez de no escribir
      nada—, que el test caza.
- [x] 6.3 `pnpm verify` entero. 13 de 13 tareas, con las dos baterías.
