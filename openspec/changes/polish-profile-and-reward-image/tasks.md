## 1. La salida del perfil del niño

- [ ] 1.1 Poner `LeaveProfile` en `ChildSettings`, sin tocar la pieza: ya no navega y no tiene por qué
      enterarse de desde dónde la montan. Sigue en `ChildHome`.
- [ ] 1.2 Test de que se sale desde «Mi perfil» y desde el inicio, y de que las dos hacen lo mismo.
- [ ] 1.3 Test de que en ninguna de las dos pantallas del niño se ofrece cerrar la sesión de cuenta.
- [ ] 1.4 Comprobar que el test de destinos del marco **sigue pasando sin editarlo**. Si hubiera que
      tocarlo, es que salir se coló como destino y la decisión 1 está mal implementada.

## 2. La cuenta del padre dice de quién es

- [ ] 2.1 Tarjeta de identidad en `/account` —avatar, nombre y correo— leyendo el actor de la sesión,
      con las piezas del sistema y **antes** de los controles que cambian credenciales.
- [ ] 2.2 Los textos al catálogo de `apps/web/src/lib/messages.ts`. Ni un string suelto.
- [ ] 2.3 Test de que se ven nombre y correo, y de que son los de quien está dentro —con **dos**
      actores distintos, o el test pasaría con un valor fijo escrito a mano.
- [ ] 2.4 Test de orden: la identidad aparece antes que el cambio de PIN en el documento.

## 3. El teclado físico en el PIN

- [ ] 3.1 Escuchar el teclado mientras `Keypad` está montado, reutilizando **la misma función** que
      usan los botones. Dígitos y retroceso; el resto de teclas no altera nada.
- [ ] 3.2 Ignorar el teclado mientras el envío está en curso, que es lo que en pantalla hace el
      `disabled`. Y limpiar el oyente al desmontar.
- [ ] 3.3 Tests: se teclea el PIN entero y entra; se corrige con retroceso sin gastar intento; se
      empieza en pantalla y se termina tecleando y vale igual; una letra no hace nada.
- [ ] 3.4 Test de que un PIN completo **no se envía dos veces** si se sigue tecleando mientras se
      comprueba. El caso tiene que dar un número de envíos distinto si la guarda falta.

## 4. Contratos de la imagen en el alta

- [ ] 4.1 `imageUploadKey` opcional en `createRewardSchema`, reutilizando `uploadKeySchema`. El
      esquema sigue `.strict()`.
- [ ] 4.2 Comprobar que el paquete compila solo y que `updateRewardSchema` no cambia.

## 5. La vía de subida y el alta con foto

- [ ] 5.1 `POST /rewards/image/upload-url` con `requireParent`, registrada **ANTES** que
      `/rewards/:rewardId`, con su comentario de por qué el orden importa.
- [ ] 5.2 Servicio: el prefijo del padre —`rewards/pending/{userId}/`— como política del módulo, junto
      al que ya existe para un premio concreto.
- [ ] 5.3 Confirmar la clave en el alta con `isConfirmableUpload` contra ese prefijo, y rechazar con
      el error de dominio que ya existe para una imagen inválida.
- [ ] 5.4 Test del **orden de rutas**: pedir la vía de subida no se interpreta como el detalle de un
      premio llamado `image`.
- [ ] 5.5 Tests del alta con foto: camino feliz; clave de otro padre rechazada; clave con el prefijo
      propio pero sin objeto detrás rechazada; y que en los dos rechazos **el premio no se crea**.
- [ ] 5.6 Tests de autorización: un niño no obtiene la vía de subida, y sigue sin poder confirmar la
      foto de un premio.
- [ ] 5.7 Comprobar que `account-only-routes.test.ts` **pasa sin tocarlo**: la lista sigue en cinco.

## 6. El front de la imagen del premio

- [ ] 6.1 `RewardForm`: elegir foto en el alta, opcional, subiendo antes de publicar y mandando la
      clave. Cancelar deja la imagen huérfana y eso está aceptado.
- [ ] 6.2 Los tres estados de la subida con las piezas del sistema, y sus textos al catálogo.
- [ ] 6.3 Test de que se publica un premio con foto y de que se puede publicar sin ella.

## 7. El respaldo cuando no hay foto

- [ ] 7.1 Dibujar el glifo de regalo en el sitio de la imagen, con las mismas medidas y con
      `aria-hidden`, en `RewardCatalog` y en `MyRewards`.
- [ ] 7.2 Test de que un premio sin foto enseña el respaldo y uno con foto enseña la foto **y no
      además el respaldo** — comprobando las dos cosas, o un respaldo siempre presente pasaría.
- [ ] 7.3 Test de que el respaldo no llega a quien escucha la pantalla.

## 8. Hacer cumplir

- [ ] 8.1 **Inyectar las violaciones**, y las cinco tienen que caer: salir solo en el inicio; la
      identidad del padre con un valor fijo; el teclado del PIN por un camino propio en vez del
      compartido; publicar sin comprobar el prefijo; y el respaldo pintado también cuando hay foto.
      Toda sustitución con `assert`.
- [ ] 8.2 `pnpm lint` del web ANTES de la batería.
- [ ] 8.3 La batería de la API **sola y una sola pasada** —son ~14 minutos y dos suites sobre la misma
      base se pisan—, y después el resto.

## 9. Documentar

- [ ] 9.1 `config.yaml`: la superficie de `/rewards` gana su vía de subida sin premio, con el porqué
      del prefijo del padre y con la frase de que **no** desbloquea la foto al crear un perfil.
- [ ] 9.2 `CLAUDE.md`: lo que salga que valga para el siguiente.
