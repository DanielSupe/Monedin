## Context

Ver `proposal.md` — Why. El estado que lo explica:

- Los dos marcos son `<div className="flex min-h-dvh flex-col">`: **altura MÍNIMA**, no fija. Quien
  desplaza es el documento.
- Dentro, `<div className="flex min-h-0 flex-1">` con el `<aside>` y el `<main>` en fila. El aside no
  declara altura, así que en una fila `flex` se estira hasta la altura de la fila — que es la del
  contenido más largo, o sea la página entera.
- `Sidebar` ya trae `min-h-0 flex-1 ... overflow-y-auto` en su `<nav>` y el pie fuera de él. La
  estructura para que el pie se quede es correcta; lo que falta es que **algo, más arriba, tenga una
  altura que respetar**.
- La columna solo se monta cuando `useIsWide()` dice que hay ancho. En estrecho es un cajón.

## Goals / Non-Goals

**Goals:**

- Que el pie de la columna esté siempre a la vista mientras la columna esté delante.
- Que los destinos se desplacen dentro de la columna si no caben.
- No tocar nada de la forma estrecha.

**Non-Goals:**

- Cambiar los destinos, el contraído o dónde vive el perfil.
- Fijar la cabecera, que sigue desplazándose con el contenido.

## Decisions

### 1. Se ata el MARCO a la ventana, no la columna con `sticky`

```
   Hoy                                Después (solo en ancho)
   ───                                ───────────────────────
   marco   min-h-dvh                  marco   h-dvh, overflow oculto
   aside   se estira con la fila      aside   la altura de la fila, que ya es la ventana
   main    crece y empuja             main    overflow-y-auto: lo que se desplaza
   ↑ desplaza el DOCUMENTO            ↑ desplaza el CONTENIDO
```

**Alternativa descartada: `sticky top-0` en la columna.** Es lo primero que se prueba y no resuelve
lo que se pide. La columna empieza **por debajo de la cabecera**, así que con `top-0` y altura de
ventana su borde inferior cae fuera de la pantalla justo lo que mide la cabecera: al abrir, sin haber
desplazado nada, el pie ya estaría por debajo del pliegue. Ajustarlo pediría descontar la altura de
la cabecera, que es una medida que nadie tiene y que cambia con la escala.

**Alternativa descartada: fijar también la cabecera.** Arreglaría el descuadre de `sticky` a cambio
de quitarle sitio al contenido de forma permanente, y la cabecera no molesta desplazándose.

### 2. Solo cuando la columna está delante

En estrecho **no se toca nada**, y no por prudencia: `100dvh` con desplazamiento interior pelea con
la barra del navegador de un móvil, que aparece y desaparece al desplazar y cambia la altura de la
ventana mientras se lee. El documento desplazándose es lo correcto ahí, y además el cajón no tiene
este problema —se abre encima y se cierra—.

`useIsWide()` ya decide qué forma se monta, así que la altura la decide **el mismo valor** que la
navegación. No hay una segunda fuente que pueda separarse de la primera.

### 3. `Sidebar` no se toca

Su `<nav>` ya declara `min-h-0 flex-1 overflow-y-auto` y el pie ya está fuera de él. Esa estructura
era correcta desde `pin-sidebar-on-desktop` y nunca llegó a ejercerse: sin un contenedor acotado por
encima, no había altura que desbordar y `overflow-y-auto` no tenía nada que hacer.

Es la señal de que el defecto no estaba en la pieza sino en quien la coloca, y por eso el arreglo
vive en los dos marcos y no en ella.

### 4. Los dos marcos, y a la vez

`ParentShell` y `ChildShell` tienen el mismo defecto por la misma línea. Arreglar uno solo dejaría
una asimetría invisible hasta que alguien abriese la aplicación con el otro rol — y el niño es
precisamente quien tiene listados largos, porque sus premios van en rejilla.

## Risks / Trade-offs

- **El contenido pasa a desplazarse dentro de un contenedor** → Cambia dónde vive la barra de
  desplazamiento en escritorio. Es lo que hace cualquier aplicación con columna fija, y solo ocurre
  en ancho.
- **`h-dvh` con desplazamiento interior en un móvil** → No aplica: en estrecho no se cambia nada.
- **Volver arriba al navegar** → Con el documento desplazándose, el navegador restaura la posición;
  con un contenedor, hay que comprobar que un destino nuevo no aparece a medio desplazar. Va como
  tarea de mirar la aplicación, porque jsdom no desplaza nada.

## Migration Plan

Sin migración: es CSS del marco.

## Decisiones que este change NO toma

- **Si la cabecera debería quedarse fija.** Hoy no molesta y ocuparía sitio permanente.
- **Si el contenido debería recordar dónde estaba al volver atrás.** Se mira si aparece, con la
  aplicación delante.
