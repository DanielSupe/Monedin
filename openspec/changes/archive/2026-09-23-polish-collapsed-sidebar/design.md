# Diseño

## 1. El número se va; el aviso, no

La instrucción fue «quitar esos números cuando está colapsado», y se cumple: el
número deja de dibujarse. Lo que NO se va con él es la señal de que hay algo
esperando, y conviene decir por qué se conserva en vez de quedarse con la lectura
más corta de la frase.

Un padre contrae la columna y la deja contraída. Si el aviso desaparece con el
número, contraer pasa a significar «deja de enterarte de que hay tres tareas por
aprobar» — y eso no es lo que nadie pide al pulsar una flecha. El punto ocupa lo
que ocupa un punto, no se sale de la columna, y dice exactamente lo que cabe decir
en 71 px: **hay algo**. Cuántos se ve al expandir o al entrar.

Y para quien no ve la pantalla no cambia nada: la cuenta iba ya en un texto
`sr-only` —«3 esperando»— y ese texto se queda entero. Lo que se quita es el
dibujo, no el dato.

**Descartado**: encoger el número hasta que quepa. Da una cifra de menos de 10 px
contra el borde, que es peor que no ponerla — ilegible y además desalineando el
icono, que es la mitad del defecto que se venía a arreglar.

## 2. La insignia se coloca sobre el icono, y por eso deja de empujar

El defecto no es el tamaño: es `ml-auto`. Un margen automático reparte el espacio
sobrante, así que icono e insignia se van a los bordes opuestos y `justify-center`
no puede hacer nada — un margen automático gana a `justify-content`.

Contraída, la insignia sale del flujo (`absolute`) y se posa en la esquina del
enlace. Sin flujo no hay nada que empujar, así que el icono queda centrado por la
misma regla que ya estaba escrita y que hasta ahora no podía cumplirse.

## 3. El aspecto de la insignia se muda al lateral

`sidebarBadgeClasses()`, junto a `sidebarItemClasses()`. Es la cuarta vez que el
proyecto usa este patrón —después de `buttonClasses`, `tabLinkClasses` y
`sidebarItemClasses`— y aquí hay una razón más: **lo que cambia con `collapsed` lo
tiene que declarar quien sabe de `collapsed`**. `PendingBadge` vive en
`features/parents/` y no sabe que existe una columna que se contrae; con el aspecto
escrito dentro, la siguiente insignia que alguien añada volvería a salirse.

`PendingBadge` conserva lo suyo, que es la CUENTA: de dónde sale, el `+` de «al
menos», y no pintarse cuando vale cero.

## 4. El glifo del final se declara, no se hereda

`SidebarTrailing`, hermano de `SidebarLabel` y con la regla contraria: el nombre se
oculta **a la vista** y se conserva para quien no mira, porque nombra el destino;
el glifo del final se oculta **del todo**, porque es decorativo y no nombra nada.
Esa asimetría es justo lo que hay que declarar en una pieza en vez de dejarlo a que
cada marco se acuerde.

**Descartado**: pasarle el icono a `SidebarProfile` como prop. Los dos marcos ponen
la fila del perfil entera —avatar, texto y glifo— y el glifo cuelga del enlace, no
del perfil. Un hueco lo envuelve donde está; una prop obligaría a `SidebarProfile` a
dibujar algo que no es suyo.

## 5. La cabecera del lateral

Una fila arriba, con su borde inferior, con el control alineado al final en ancho y
centrado en contraído. Es donde shadcn pone su `SidebarTrigger` y donde se busca: el
control del marco, en el marco, arriba.

Va **dentro** del lateral y no en la cabecera de la aplicación, que es la otra
lectura posible de la petición. La razón es la que ya se aplicó al botón de menú:
un control que gobierna la columna solo existe cuando la columna está delante, y la
cabecera de la aplicación se dibuja también en estrecho, donde no hay nada que
contraer. Puesto ahí habría que esconderlo por ancho — y esconder por ancho es
exactamente lo que este marco no hace.

## 6. Qué test lo sostiene

jsdom no aplica CSS, así que «se ve bien centrado» no se prueba. Lo que se prueba es
lo que el DOM dice:

- Contraída, la cuenta **no aparece como texto visible** y sí sigue estando el texto
  accesible. Distingue: con la insignia de hoy, el número visible está y el test
  falla.
- El glifo del final del perfil **no está en el documento** cuando la columna está
  contraída.
- El control de contraer está **antes** que los destinos en el orden del documento,
  y no después del perfil.

Lo que queda como tarea manual, porque ningún test lo ve: que nada se salga de los
71 px y que el punto se lea. Se mira abriendo la aplicación.
