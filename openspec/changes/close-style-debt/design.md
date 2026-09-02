## Context

`add-design-system` dejó dos listas de excepciones con su condición de muerte escrita: cada change de
rediseño borra su línea, y **cuando queden vacías se borra el bloque entero**. Nueve changes después
queda una entrada.

Este change la cierra. Lo que entrega no es una pantalla vestida: es que la regla pase a cubrir todo
el código sin lista que mantener.

Y al abrir esa pantalla apareció un defecto que no era suyo sino del proyecto: **el número del PIN
está escrito a mano en seis sitios**, tres de ellos dentro de cadenas del catálogo de textos, donde
no parece un número de negocio y lo es.

## Goals / Non-Goals

**Goals**

- Vestir la última pantalla, incluida la regla de las dos credenciales.
- **Borrar la maquinaria de la deuda**, no dejarla vacía.
- Llevar los seis números a su constante y atarlo con test.

**Non-Goals**

- **Tocar la excepción legítima** de estilos en línea, que es otra cosa y se queda.
- **Subir una foto al crear un perfil.** Sigue con dueño y sin resolverse de pasada.
- **Tocar la API.** Ni un endpoint.

## Decisions

### 1. La lista no se deja vacía: se BORRA

Dejar `SIN_VESTIR = []` y su filtro «por si acaso» sería peor que borrarlos. Una lista vacía es una
puerta abierta: el día que alguien tenga prisa, añadir una línea cuesta menos que vestir la pantalla,
y el mecanismo está ahí invitando.

Se van tres cosas:

```
eslint.config.js       el segundo bloque `allowInlineStyles([...])`  entero
style-rules.test.ts    la constante SIN_VESTIR
                       la función estaSinVestir y su uso en el filtro
                       el test «la lista solo puede encoger»
```

**Se queda** el PRIMER `allowInlineStyles`, con sus tres archivos y sus tres justificaciones. Es la
excepción legítima —una medida que se calcula y ningún token puede expresar— y no tiene nada que ver
con estar sin vestir.

Al quitar el filtro, los tests de estilo pasan a escanear archivos que antes no miraban. Si alguno
tuviera un color a mano, saldría ahora: es exactamente lo que este change existe para descubrir.

### 2. El número del PIN: seis sitios, y tres de ellos invisibles

```
maxLength={4}          ChangePinScreen ×2, ResetPinScreen ×1
"PIN de 4 dígitos"     auth.pin, children.pin
"…de 6 a 11 años"      app.tagline  ← CHILD_AGE_MIN y CHILD_AGE_MAX
```

Los tres primeros los vería cualquiera al leer el archivo. Los tres últimos no: **dentro de una
cadena, un número de negocio no parece un número de negocio**. Y son justo los que más se pudren,
porque el código lo protege un esquema de Zod y al texto no lo protege nada — el día que el PIN pase
a cinco dígitos, el campo aceptará cinco y la etiqueta seguirá diciendo cuatro.

La cifra se compone en el punto de uso, que es el patrón que ya existe: `passwordMinHelp` +
la constante + `passwordMinHelpTail`.

### 3. Los dos tests, y por qué el de las cadenas puede ser tan estricto

- **Ninguna cadena del catálogo contiene una cifra.** Suena agresivo y no lo es: hoy son
  **exactamente tres** las que las llevan, y las tres son constantes de dominio. Cero falsos
  positivos. Si algún día hace falta un texto con un número que NO sea de dominio, se verá al
  añadirlo y se decidirá entonces — que es mejor que no enterarse.
- **Ningún `maxLength` con un literal.** `maxLength={TITLE_MAX_LENGTH}` pasa; `maxLength={4}` no.

Los dos se comprueban **inyectando** la violación, que es donde este proyecto ha aprendido que un
test puede estar en verde por la razón equivocada.

### 4. Las dos credenciales de la vía de rescate

Pide la contraseña y un PIN nuevo, juntas y sin una palabra. Es literalmente el mismo caso que
`redesign-access` arregló en el registro, y la regla quedó escrita: si no se explica para qué sirve
cada una, parece un error del producto.

Aquí además hay una asimetría que conviene decir: **la contraseña es lo que demuestra que eres tú, y
el PIN nuevo es lo que vas a usar a partir de ahora**. Quien llega a esta pantalla está bloqueado
fuera de su propio perfil, o sea nervioso.

### 5. Lo que NO cambia de esta pantalla

Sigue sin exigir perfil activo, a propósito —decisión 3 del design de `add-profile-selection`—, sigue
llevando `EntryShell` y sigue abriéndose desde el teclado de PIN del padre. Es el único camino de
vuelta para un padre bloqueado, así que este change no toca por dónde se llega ni a dónde se sale.

## Risks / Trade-offs

- **Quitar el filtro amplía lo que los tests de estilo miran.** Puede aparecer algo que llevaba
  meses tapado. Es el objetivo, no un riesgo — pero puede alargar el change.
- **El test de cadenas sin cifras es una regla fuerte.** Se acepta a conciencia: hoy no molesta a
  nadie y el día que moleste, esa molestia es la conversación que hay que tener.
- **`app.tagline` es texto de marketing** y llevará el rango de edad compuesto. Se acepta: el rango
  es del producto, no del copy.

## Migration Plan

Sin migración: mismas direcciones, mismas guardas, mismos contratos.

## Open Questions

Ninguna que bloquee.

## Decisiones que este change NO toma

- **Qué hacer si algún día hace falta un texto con una cifra que no sea de dominio.** Se decide
  cuando aparezca.
- **La foto al crear un perfil.** Sigue con dueño y con sus dos precios medidos.
