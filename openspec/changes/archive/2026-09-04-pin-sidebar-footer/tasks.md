## 1. El marco atado a la ventana

- [x] 1.1 En `ParentShell`, altura de ventana y desplazamiento oculto en el marco **solo cuando la
      columna está delante**, decidido por el mismo `useIsWide()` que ya elige la forma.
- [x] 1.2 El contenido pasa a ser lo que se desplaza, también solo en ese caso.
- [x] 1.3 Lo mismo en `ChildShell`: es la misma línea y el mismo defecto.
- [x] 1.4 Comprobar que `Sidebar` NO hace falta tocarlo — su `overflow-y-auto` ya estaba puesto y
      solo le faltaba un contenedor acotado por encima. Si hubiera que tocarlo, el diagnóstico está
      mal.

## 2. Tests

- [x] 2.1 Test de que en ANCHO el marco acota su altura y el contenido es lo que desplaza, en los dos
      roles. Se comprueba la elección, no el pintado: jsdom no aplica CSS ni desplaza.
- [x] 2.2 Test de que en ESTRECHO no cambia nada — el documento sigue desplazándose. Comparar los dos
      casos ENTRE SÍ: comprobar solo el ancho pasaría con la altura atada siempre, que es la
      regresión que romperia el móvil.
- [x] 2.3 Los tests que ya existen del lateral y del cajón siguen pasando **sin tocarlos**.
- [x] 2.4 **Inyectar las violaciones**, y las dos tienen que caer: el marco sin acotar —el defecto de
      hoy— y el marco acotado también en estrecho.

## 3. Lo que ningún test cubre

- [x] 3.1 **Abrir la aplicación** en ancho, con una pantalla larga —la cuenta del padre, el escaparate
      del niño— y confirmar que el perfil del pie no se mueve al desplazar.
- [x] 3.2 Comprobar que al navegar a otro destino el contenido aparece arriba y no a medio desplazar.
- [x] 3.3 Estrechar la ventana hasta el cajón y confirmar que ahí todo sigue igual que antes.

## 4. Cerrar

- [x] 4.1 `pnpm lint` del web y su batería. La API no se toca — comprobarlo antes de saltársela.
- [x] 4.2 `CLAUDE.md` con lo que salga que valga para el siguiente.
