## Why

Quedan los perfiles de hijo: el listado del padre, el formulario que sirve para el alta y la edición,
y las dos pantallas que lo envuelven. Son **cuatro de las cinco** entradas que quedan en la lista de
deuda, y al vestirlas esa lista se queda con una sola.

Lo que hay dentro no es solo andamio:

- **Una acción irreversible se confirma con un párrafo.** Dar de baja un perfil no se puede deshacer
  —lo dice su propio mensaje— y se pregunta con un `<p role="alert">` y dos botones sueltos en la
  fila. El catálogo de premios acaba de pasar esa misma confirmación a `Dialog`, que atrapa el foco y
  cierra con Escape. La baja de un hijo pesa más que retirar un premio y se pregunta con menos.
- **Un perfil bloqueado se marca con un color escrito a mano**, `#b00020`, dentro de una frase. Es
  información de estado, que es justo lo que `Badge` existe para dar, y además el rojo dice «error»
  donde lo que hay es «este niño falló el PIN varias veces».
- **La paginación se reescribe por CUARTA y última vez.** Con esta pantalla, `ui/Pagination` pasa a
  tener todos sus consumidores.

## What Changes

- **Las cuatro pantallas se visten** con las piezas del sistema.
- **La baja se confirma con `Dialog`**, como la retirada de un premio.
- **`Badge` para el estado bloqueado**, en advertencia y no en peligro: fallar el PIN no es un error
  del padre ni una avería.
- **La cuarta copia de la paginación se va** a `Pagination`.
- **La lista de deuda baja de 5 a 1**, y lo único que queda es `ResetPinScreen`, que tiene su propio
  change porque se abre sin sesión.

## No incluye

- **Subir una foto al CREAR un perfil.** Se decidió aplazarla otra vez, y esta vez **con dueño**: deja
  de estar flotando en `CLAUDE.md` y pasa a ser un change propio. Los dos caminos siguen escritos, y
  este change añade el dato que faltaba para elegir: **todos** los endpoints de subida cuelgan del
  identificador de una entidad que ya existe, así que el camino de «un solo momento» exige un
  endpoint nuevo — el primer cambio de API de toda esta etapa.
- **Unificar cómo se edita un hijo y cómo se edita un premio.** El hijo sigue en su ruta y el premio
  en línea, y aquí se explica por qué no es una incoherencia.

## Capabilities

### Modified Capabilities

- `parent-console`: cómo el padre ve y mantiene los perfiles de sus hijos.

## Impact

- **Front, y solo front.** Cero cambios en la API, en los contratos o en la base de datos.
- `ChildrenList.tsx`, `ChildForm.tsx`, `CreateProfileScreen.tsx` y `EditChildScreen.tsx` se
  reescriben.
- Dos listas de deuda quedan con **una** entrada.
- `messages.ts` gana lo que falte para el diálogo de baja.
