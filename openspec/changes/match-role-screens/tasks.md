# Tareas

## 1. Lo que es de todas las pantallas

- [x] 1.1 Una función en `lib/` que escriba una fecha como la escribe el producto, con el idioma
      DECLARADO y no el del dispositivo. Son DOS formas, no una, y por un papel cada una: la larga
      —«8 de septiembre»— para una línea de texto, y la corta —«8 sept»— para una CELDA, que es lo
      que una pantalla ya necesitaba porque su tabla son cuatro columnas en 390px. Ninguna lleva año.
- [x] 1.2 Usarla en los cuatro sitios que hoy deciden su formato por separado.
- [x] 1.3 Un test que falle si una pantalla vuelve a llamar a `toLocaleDateString` por su cuenta. Una
      regla que solo vive en un documento está muerta al tercer mes. Y mira las DOS mitades: que
      nadie más decida el formato, y —por el RESULTADO— que el idioma esté declarado. Sin la segunda,
      un `toLocaleDateString(undefined, …)` dentro de la propia función pasaría cualquier revisión,
      porque a quien desarrolla en español le sale en español. Violación inyectada y cazada.
- [x] 1.4 Mover la ayuda al lateral con su nombre, y QUITARLA de la cabecera: dejarla en los dos
      sitios sería una segunda excepción a «ningún destino dos veces». Va al PIE, separada de los
      destinos por el mismo borde que separa el perfil, que es lo que dibujan las maquetas — y así se
      respeta el argumento que ya estaba escrito: la ayuda no es un destino de TRABAJO.
      **Y su pieza afirmaba en su cabecera «lleva nombre y no solo un símbolo»** cuando lo que había
      era un interrogante mudo con el nombre en `aria-label`. Corregida.
- [x] 1.5 Actualizar el test que enumera los destinos de cada rol, y comprobar que sigue cazando el
      duplicado. El bloque que decía «el acceso a la ayuda vive en la cabecera» tenía sus dos mitades
      desiguales: la que comprobaba que NO se mezcla con los destinos sostenía un argumento y se
      queda; la que comprobaba que se encuentra sin abrir el cajón solo describía dónde estaba
      entonces, y se sustituye por que está en el pie. Hay además un caso nuevo que exige su nombre
      EN PANTALLA —con el interrogante mudo, `getByRole` lo encontraba igual—. Cinco casos caen al
      quitar la ayuda del pie.

## 2. Las quince del padre

- [x] 2.1 Panel. **Cuadra**: con las fechas y la ayuda arregladas, lo único que difiere de su maqueta
      son las cifras de la siembra, el nombre partido en dos nodos, el singular que la aplicación
      declina bien, y la línea del asistente — que la maqueta no dibuja y es de la aplicación.
- [ ] 2.2 Tareas, y su formulario de reparto
- [ ] 2.3 Canjes
- [ ] 2.4 Premios, y su formulario de alta
- [ ] 2.5 Hijos, y la edición de un hijo
- [ ] 2.6 Historial de un hijo
- [ ] 2.7 Cuenta
- [ ] 2.8 Chat
- [ ] 2.9 Ayuda
- [ ] 2.10 Los tres diálogos: baja, retirar, recorte

## 3. Las nueve del niño

- [ ] 3.1 Inicio
- [ ] 3.2 Tareas
- [ ] 3.3 Premios
- [ ] 3.4 Canjes
- [ ] 3.5 Monedas
- [ ] 3.6 Perfil
- [ ] 3.7 Chat
- [ ] 3.8 Ayuda
- [ ] 3.9 Recorrido

## 4. Cierre

- [ ] 4.1 Volver a comparar las veinticuatro y dejar escrito lo que sigue sin cuadrar.
- [ ] 4.2 Los dos temas.
- [ ] 4.3 `pnpm verify` entero.
