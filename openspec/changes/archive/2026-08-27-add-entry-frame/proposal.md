## Why

Las cinco pantallas por las que se pasa **antes de ser alguien** —acceso, rejilla, teclado de PIN,
crear perfil y restablecer PIN— no tienen marco. Caen en el contenedor de lectura de la raíz:

```tsx
<main className="mx-auto max-w-(--container-reading) px-4 py-8">
```

Eso las pega arriba, con el resto de la pantalla vacío debajo, y **sin marca**. Monedín aparece en la
puerta pública y en los dos marcos de la aplicación, y desaparece justo en los pasos de en medio: se
entra por una página con logo, se pasa por cuatro pantallas anónimas, y el logo vuelve al final.
Quien está en el paso tres no tiene nada que le diga dónde está.

Y en la rejilla, que es la pantalla más transitada del producto, los círculos se quedan pequeños para
lo que son: el objetivo de toque de un niño y la respuesta a «¿quién eres?».

## What Changes

- **Un tercer marco, `EntryShell`**, para las pantallas previas a tener rol: **logo arriba a la
  izquierda** —el mismo `Logo` de la puerta pública y de los otros dos marcos— y contenido centrado
  **horizontal y verticalmente**.
- **Lo elige la raíz sin un solo `if` sobre la dirección**: son exactamente las rutas sin actor que no
  piden ancho completo. No hay lista que mantener.
- **Los círculos de la rejilla pasan de 6 rem a 8 rem**, con una talla nueva en `Avatar` en vez de
  una medida escrita en la rejilla.

## Capabilities

### Modified Capabilities

- `app-navigation`: los tres estados de la aplicación pasan a tener los tres su propio marco. Antes
  eran dos marcos y un contenedor sin identidad.

### New Capabilities

Ninguna.

## Impact

**Código modificado**: `apps/web/src/app/EntryShell.tsx` (nuevo), `routes/__root.tsx`,
`ui/Avatar.tsx` y `features/auth/ProfileGrid.tsx`.

**API, contratos y base de datos**: sin tocar. **Dependencias**: ninguna.

**Lo que cambia de aspecto**: las cinco pantallas de entrada. Ninguna otra.

## No incluye

- **Subir una foto al crear un perfil.** Se pidió y **se deja fuera a propósito**: hoy solo se puede
  elegir un animal, porque la clave de subida lleva dentro el identificador del hijo y ese
  identificador no existe todavía mientras se está creando. Resolverlo son dos caminos con precios
  muy distintos —hacerlo en dos momentos sin tocar la API, o en uno solo abriendo una vía de subida
  nueva bajo el prefijo del padre, con `avatarUploadKey` en el alta y una política para las fotos
  huérfanas—, y esa decisión merece su propio change. **Queda pendiente y sin decidir.**
- **Vestir las pantallas que el marco enmarca.** El acceso, el alta de perfil y el restablecimiento
  de PIN siguen siendo andamio por dentro: eso es `redesign-access`. Este change les pone el marco,
  no el contenido.
- **La puerta pública.** `/welcome` ya tiene su propio encabezado con el logo y pide ancho completo;
  se queda exactamente como está.
- **Tocar los marcos del padre y del niño.**
