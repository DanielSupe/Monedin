> El token se cambia en el paso 2, no en el 1. Primero se comprueba que la fuente llega **desde
> nuestro origen**; si eso no se cumple, el resto del change no vale nada. Ver el plan de migración.

## 1. La fuente, sin usarla todavía

- [x] 1.1 Añadir `@fontsource-variable/nunito` a `apps/web`.
- [x] 1.2 Importar la hoja de la fuente al principio de `tokens.css`, junto al import de
      Tailwind. **Corregido al implementar**: decía `latin-ext.css`, que no existe; el paquete sirve
      `wght.css`, con los cinco subconjuntos y su `unicode-range`, así que un usuario en español baja
      solo `latin`. Ver la decisión 2 del design. Ahí y no en cada punto de entrada: los dos ya importan ese archivo, y dejarla fuera del
      catálogo vivo lo haría mentir sobre cómo se ven las piezas.
- [x] 1.3 **Comprobar en el navegador que el `.woff2` sale de `localhost` y NO de `fonts.gstatic.com`.**
      Fontsource es autoalojado por diseño, pero un import equivocado podría no serlo, y la diferencia
      **no se ve leyendo el código**. Si aparece un dominio de Google, la decisión de autoalojar no se
      cumplió y el change está mal.
- [x] 1.4 En este punto la aplicación se ve **exactamente igual** que antes: la fuente está cargada y
      nadie la usa.

## 2. El token

- [x] 2.1 `--font-sans: "Nunito Variable", …` con la pila del sistema **detrás**. Sin el respaldo, un
      fallo de carga da la serif por defecto del navegador: Times New Roman en una app para niños.
- [x] 2.2 Actualizar el comentario del token, que hoy dice que la tipografía de marca llega en otro
      change. Ya llegó.
- [x] 2.3 Mirar las tres superficies: `/welcome`, el marco del padre y el del niño.
- [x] 2.4 **Buscar disposiciones rotas**: Nunito es algo más ancha que Roboto, así que un texto que hoy
      cabe justo puede envolver. Revisar las pantallas con menos sitio, sobre todo la barra inferior
      del niño y las listas del padre.

## 3. Los números, que es lo que este producto enseña

- [x] 3.1 Cifras tabulares en `Coins`. En la pieza y **no** en `body`: alinear cifras es correcto en
      una columna de números e incorrecto en un texto corrido.
- [x] 3.2 Comprobar con una lista de hijos con saldos de distinta longitud —`120` y `1.250`— que los
      dígitos **alinean**.
- [x] 3.3 Comprobar que la cuenta animada del saldo de la landing ya **no desplaza** el texto a cada
      paso.
- [x] 3.4 Mirar el saldo enorme del niño a 4rem y un PIN de cuatro dígitos: son los dos sitios donde
      alguien de seis años lee un número.

## 4. Lo que impide la vuelta atrás

- [x] 4.1 Test que lee `tokens.css` y falla si `--font-sans` deja de empezar por la familia de la
      marca. Es lo que evita que un descuido nos devuelva a una tipografía por dispositivo.
- [x] 4.2 El mismo test comprueba que **detrás queda un respaldo del sistema**.
- [x] 4.3 Test de que `Coins` pide cifras tabulares.
- [x] 4.4 Comprobar que los tres fallan de verdad inyectando una violación, y no pasan por vacíos.

## 5. Cierre

- [x] 5.1 Comprobar el **peso real** del archivo tras compilar. Si pasa de ~60 KB, el subconjunto está
      mal elegido.
- [x] 5.2 Con la red a 3G lenta en el emulador: el texto tiene que ser visible desde el primer momento
      con el respaldo, y el cambio al cargar no debe descolocar la página.
- [x] 5.3 En 390×844: que nada se salga de lado con la tipografía nueva.
- [x] 5.4 Verificación completa. `pnpm verify` no cabe en esta máquina: usar
      `pnpm turbo run lint typecheck test build --force --concurrency=1`, con Docker arriba. Y si se
      corta por un fallo, **lo que queda detrás no es verde, es desconocido**: correr los paquetes
      restantes por separado.
- [x] 5.5 Actualizar `README.md`, la sección de front de `openspec/config.yaml` y `CLAUDE.md`, y
      **quitar la tipografía del alcance de `polish-brand-and-a11y`** allí donde esté anotada.
- [x] 5.6 Si alguna decisión del design resultó equivocada al implementarla, **actualizar el design y
      decirlo**.
