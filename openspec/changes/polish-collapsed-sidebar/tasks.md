# Tareas

## 1. La cabecera

- [x] 1.1 Sacar el control de contraer del pie y ponerlo en una cabecera propia del lateral, con su
      borde, alineado al final en ancho y centrado en contraído.

## 2. Lo que se sale

- [x] 2.1 `sidebarBadgeClasses()` en `Sidebar.tsx`: el aspecto de la insignia junto al de sus
      hermanos, porque lo que cambia con `collapsed` lo declara quien sabe de `collapsed`.
- [x] 2.2 `PendingBadge` pasa a usarlo y se queda solo con la cuenta.
- [x] 2.3 Contraída, la cifra no se dibuja y queda un punto en la esquina del icono. El texto
      accesible se queda entero.
- [x] 2.4 `SidebarTrailing` para el glifo del final, y los dos marcos lo usan en su fila de perfil.

## 3. Lo que lo sostiene

- [x] 3.1 Test: contraída, la cifra no se ve y el texto accesible sigue. **Inyectar la violación**.
- [x] 3.2 Test: contraída, el glifo del perfil no está en el documento.
- [x] 3.3 Test: el control de contraer va antes que los destinos.
- [x] 3.4 Abrir la aplicación contraída, en los dos temas y en los dos marcos: que nada se salga de la
      columna y que el punto se lea. Ningún test lo ve.

## 4. Cierre

- [ ] 4.1 `pnpm verify` entero.
