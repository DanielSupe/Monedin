## Why

El inicio del niño es la pantalla que se abre al entrar a su perfil, y es la única del producto donde
él ve **su saldo**. Sigue siendo andamio: un `<h2>`, un párrafo y una lista de cuatro enlaces
subrayados.

```tsx
<p>
  Tienes <strong>{coins}</strong> monedas.
</p>
```

El número que el producto entero existe para enseñar sale en negrita dentro de una frase, al mismo
tamaño que todo lo demás. La escala del niño tiene `--text-hero` en **4 rem** precisamente para esto,
y esta pantalla no la usa.

Hay además un problema de sitio. Las dos pantallas de inicio —la del niño y la del padre— **viven
dentro del archivo de ruta**, decididas por un condicional sobre el rol:

```tsx
{actor.familyRole === "CHILD" ? <ChildHome coins={actor.coins} /> : <ParentHome />}
```

Un archivo de ruta monta rutas; no sostiene pantallas. Es lo mismo que `add-app-shell` retiró de
quince componentes, y lo que mantiene a `routes/` en la lista de deuda declarada. Y los textos
—«Hola, {nombre}», «Tienes N monedas»— están incrustados en vez de estar en el catálogo.

## What Changes

- **Las dos pantallas de inicio salen del archivo de ruta** a `features/`. La del niño se viste; la
  del padre **se muda tal cual**, sin tocar su aspecto, y espera a `redesign-parent-home`.
- **El saldo pasa a ser lo primero y lo más grande**, con la escala del niño y la pieza `Coins`.
- **Los cuatro destinos dejan de ser enlaces subrayados** y pasan a ser objetivos grandes, del tamaño
  que pide un dedo de seis años.
- **Los textos van al catálogo.** Ni uno incrustado.
- **`routes/index.tsx` queda en lo que su nombre dice**: elegir por rol y nada más.

## Capabilities

### Modified Capabilities

- `app-navigation`: un archivo de ruta deja de contener pantallas; solo monta el destino.
- `child-profiles`: el inicio del niño presenta su saldo como el elemento principal de la pantalla.

### New Capabilities

Ninguna.

## Impact

**Código modificado**: `routes/index.tsx` —que adelgaza—, dos componentes nuevos en `features/`,
`lib/messages.ts`, y las dos listas de deuda declarada.

**API, contratos y base de datos**: sin tocar. El saldo ya viaja en la sesión.

**Dependencias**: ninguna.

## No incluye

- **Vestir el inicio del padre.** Se muda de archivo sin cambiar de aspecto; vestirlo es
  `redesign-parent-home`, y mezclar dos audiencias con escalas distintas en un change lo haría
  irrevisable.
- **Las tareas, los premios y los canjes del niño**: `redesign-child-tasks` y `redesign-child-shop`.
- **`ChildSettings`**, que cuelga del avatar y no de esta pantalla.
- **El historial de monedas**: `add-coin-history`. Aquí el saldo se enseña, no se explica.
