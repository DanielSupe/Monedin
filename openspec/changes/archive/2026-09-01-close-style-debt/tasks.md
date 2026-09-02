## 1. La última pantalla

- [x] 1.1 `ResetPinScreen.tsx` vestido con `Card`, `Field`, `Input`, `Button` y `Alert`, conservando
      la validación con el esquema del contrato ANTES de enviar.
- [x] 1.2 Explicar para qué sirve cada una de las dos credenciales: la contraseña demuestra quién
      eres, el PIN nuevo es lo que teclearás a partir de ahora. Textos al catálogo.
- [x] 1.3 El éxito y el fallo con `Alert`, y la salida de vuelta a la rejilla como enlace.
- [x] 1.4 No tocar por dónde se llega ni a dónde se sale: sigue sin exigir perfil activo, sigue con
      `EntryShell` y sigue abriéndose desde el teclado de PIN.

## 2. Borrar la maquinaria

- [x] 2.1 Borrar de `apps/web/eslint.config.js` el SEGUNDO bloque `allowInlineStyles` entero, el de la
      deuda. **No tocar el primero**, que es la excepción legítima con sus tres justificaciones.
- [x] 2.2 Borrar de `tests/ui/style-rules.test.ts` la constante `SIN_VESTIR`, la función
      `estaSinVestir`, su uso en el filtro de `ARCHIVOS`, y el test que contaba la longitud de la
      lista.
- [x] 2.3 Ejecutados los tests de estilo con el filtro quitado: **no apareció nada**. Los archivos
      que llevaban meses tapados estaban limpios.

## 3. Los seis números

- [x] 3.1 `maxLength={4}` → `PIN_LENGTH` en `ChangePinScreen.tsx` (dos) y en `ResetPinScreen.tsx`.
- [x] 3.2 `auth.pin` y `children.pin` eran **la misma cadena declarada dos veces**. Se queda una, y
      la cifra se compone una sola vez en el catálogo como `PIN_LABEL`: tres pantallas la necesitan, y
      tres composiciones idénticas son tres sitios donde una se puede separar.
- [x] 3.3 `app.tagline` resultó estar **MUERTO**: no lo usa nadie. Partirlo en tres claves también
      muertas habría sido peor, así que se BORRA — y con él se va su cifra.
- [x] 3.4 Revisar que ningún punto de uso quede diciendo una cosa y el campo otra.

## 4. Hacer cumplir

- [x] 4.1 Test: **ninguna cadena del catálogo de mensajes contiene una cifra**. Con el porqué al
      lado: dentro de un texto, un número de negocio no parece un número de negocio, y es el que más
      se pudre porque al texto no lo protege ningún esquema.
- [x] 4.2 Test: **ningún `maxLength` con un literal numérico** en `src`.
- [x] 4.3 Test de que la vía de rescate explica sus dos credenciales.
- [x] 4.4 **Inyectar las tres violaciones** —una cifra en un mensaje, un `maxLength={4}`, y quitar la
      explicación de las credenciales— y comprobar que caen. Toda sustitución con `assert`.
- [x] 4.5 `pnpm lint` del paquete web ANTES de la batería.
- [x] 4.6 `pnpm turbo run lint typecheck test build --concurrency=1`: **13/13** a la primera, con las
      cuatro tareas del web ejecutadas y no servidas de caché (353 tests, 38 archivos).

## 5. Cerrar el capítulo

- [x] 5.1 Actualizar `CLAUDE.md`: la deuda declarada con fecha de caducidad **ya no existe**, la
      regla cubre todo `src`, y queda escrito que la excepción legítima es otra cosa y sigue.
