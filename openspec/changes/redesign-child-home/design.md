## Context

Ver `proposal.md` — Why.

Lo que condiciona el cómo:

- **El saldo ya viaja en la sesión** (`actor.coins`), así que la pantalla no pide nada.
- **`Coins` es la pieza de las cantidades**, con `size="hero"` y cifras tabulares, y anuncia «120
  monedas» a quien no ve la pantalla.
- **La escala del niño ya declara `--text-hero: 4rem`** y un objetivo de toque de 2.75 rem. La
  pantalla solo tiene que usarla.
- **`ChildShell` ya pone el marco**: cabecera con logo y avatar, y barra inferior con los cuatro
  destinos.
- **El marco lleva un parche declarado**: `overflow-x-auto` con un comentario que dice que la causa
  vive en las pantallas sin vestir y **la arregla su change de rediseño**.
- **`routes/` sigue en las dos listas de deuda**, y `features/children/` también.

## Goals / Non-Goals

**Goals:**

- Que el saldo se vea como lo que es: lo que el producto enseña.
- Que un dedo de seis años acierte a la primera.
- Que un archivo de ruta vuelva a ser un archivo de ruta.

**Non-Goals:**

- Vestir el inicio del padre.
- Tocar la barra inferior ni la cabecera: son del marco.
- Explicar de dónde salen las monedas. Eso es `add-coin-history`.

## Decisions

### 1. Salen las dos pantallas, se viste una

```
   antes                              después
   ─────                              ───────
   routes/index.tsx                   routes/index.tsx
     ├─ Home (elige por rol)            └─ elige por rol, y nada más
     ├─ ChildHome   ← pantalla        features/children/ChildHome.tsx   ← vestida
     ├─ ParentHome  ← pantalla        features/auth/ParentHome.tsx      ← mudada tal cual
     └─ LeaveProfile
```

**Por qué salen las dos y no solo la del niño**: dejar media pantalla dentro y media fuera es peor
que las dos formas puras. El archivo se toca una vez y queda limpio.

**Por qué la del padre se muda SIN vestir**: mezclar dos audiencias con escalas distintas en un mismo
change lo haría irrevisable, y se comería el alcance de `redesign-parent-home`. Se mueve el archivo,
no el aspecto — y eso se comprueba mirando que el inicio del padre siga viéndose igual.

**Dónde va cada una**: la del niño a `features/children/`, que es donde vive lo suyo. La del padre a
`features/auth/`, junto al resto de lo que depende del actor, y su change decidirá si merece sitio
propio.

### 2. El saldo primero, y con `Coins`

El número es lo primero de la pantalla y usa `Coins size="hero"`, que bajo la escala del niño son
4 rem. No se escribe la cifra a mano: la pieza ya formatea con el locale del producto, pide cifras
tabulares y anuncia «120 monedas» en vez de «120».

**Descartado — llevar el saldo a la cabecera del marco**: tenerlo siempre a la vista suena bien y
convierte el marco en un tablero. El inicio es el sitio donde el niño mira su saldo a propósito; en
las otras tres pantallas está haciendo otra cosa. El comentario que `add-app-shell` dejó en el código
—«es una decisión de diseño de `redesign-child-home` y este change no la toma»— queda así respondida.

### 3. Los cuatro destinos son tarjetas, no enlaces

Lo que hay es una lista de cuatro enlaces subrayados: objetivos de la altura de una letra para una
mano de seis años en una tablet compartida.

Pasan a ser tarjetas con su glifo y su texto, en rejilla. Cada una sigue siendo **un solo elemento
interactivo**, que es la regla que ya se aplicó a las teselas de la rejilla de perfiles.

**Nota**: los mismos cuatro destinos están en la barra inferior del marco. No es duplicar por error:
la barra es para moverse **mientras** se hace algo, y el inicio es la portada. Es lo mismo que hace
cualquier aplicación con pestañas.

### 4. El parche del marco se cobra aquí

`ChildShell` lleva `overflow-x-auto` con un comentario que nombra a este change:

> *«la causa vive en esas pantallas y la arregla su change de rediseño; lo que NO puede pasar mientras
> tanto es que el documento entero se mueva de lado»*

Con el inicio vestido, **una de las cuatro** deja de desbordar. El parche no se puede quitar todavía
—quedan tareas, premios y canjes—, así que lo que toca es **comprobar que esta pantalla ya no lo
necesita** y dejar dicho que se retira cuando caiga la última. Quitarlo ahora rompería las otras tres.

### 5. Dos cosas que se vieron al medir, y no estaban previstas

**El parche del marco cae a medias, y hay una pantalla huérfana.** Medido a 390 px, de las cinco
pantallas del niño el inicio, los premios y los canjes **ya caben**; siguen desbordando `/me/tasks`
—que es `redesign-child-tasks`— y **`/me/settings`**, que no lo reclama ningún change planificado.
`ChildSettings` es «Mi perfil»: cuelga del avatar, no es tareas ni es tienda, y se quedó fuera de los
tres changes del niño. **Hay que darle sitio**, o el parche del marco no podrá retirarse nunca.

**Estrechar `features/auth` destapó lo que se acababa de mudar.** `ParentHome` y `LeaveProfile`
salieron del archivo de ruta a `features/auth/`, que `redesign-access` había estrechado a cuatro
archivos nombrados. Sus estilos en línea quedaron sin excepción y el lint los cazó.

La salida no fue añadirlos a la lista: sus estilos eran `marginTop: "1rem"` y
`listStyle/padding/display/gap`, que se traducen **una a una** a `mt-4` y `list-none p-0 grid gap-2`.
**Traducir no es vestir** —no hay un color, un radio ni una decisión visual— y así la deuda no engorda
con código que solo cambió de sitio. Comprobado mirando que el inicio del padre se ve idéntico.

Es un efecto lateral previsible de estrechar por archivo en vez de por directorio, y conviene tenerlo
presente: **mudar un archivo a una carpeta estrechada lo deja fuera de su excepción**.

## Risks / Trade-offs

- **Mover la pantalla del padre sin vestirla puede cambiarla sin querer** → Se comprueba abriéndola
  antes y después. Es un movimiento de archivo, no una reescritura.
- **Cuatro tarjetas grandes más el saldo pueden no caber sin desplazar en un móvil bajo** → Se mide.
- **La lista de deuda no encoge del todo**: `features/children/` sigue dentro por `ChildSettings`,
  `ChildForm`, `ChildrenList` y compañía. Se estrecha a los archivos que quedan, como se hizo con
  `features/auth/`.

## Migration Plan

1. Sacar las dos pantallas del archivo de ruta, sin tocar su aspecto. Aquí no se ve nada.
2. Comprobar que el inicio del padre y el del niño siguen exactamente igual.
3. Vestir la del niño.
4. Estrechar la deuda y comprobar que los tests de estilo cazan la pantalla nueva.

**Vuelta atrás**: el paso 1 es reversible por sí solo, y el 3 no toca a nadie más.

## Open Questions

Ninguna.

## Decisiones que este change NO toma

- **Si el saldo debería estar también en el marco.** Descartado arriba, con su argumento.
- **Cuándo se retira el `overflow-x-auto` del marco**: cuando caiga la última pantalla del niño.
- **El aspecto del inicio del padre**: `redesign-parent-home`.
