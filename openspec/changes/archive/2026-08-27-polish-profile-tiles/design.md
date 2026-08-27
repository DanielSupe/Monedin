## Context

Ver `proposal.md` — Why.

Lo que condiciona el cómo:

- **`Avatar` fija `rounded-full`** y lo usan cinco pantallas.
- **`cx` NO fusiona utilidades de Tailwind.** Su propio comentario lo dice: «no intenta resolver
  conflictos entre utilidades». Dos radios en la misma cadena los resuelve el orden del CSS
  generado, no el orden en que se escriben.
- **El movimiento reducido lo resuelve el sistema** poniendo las duraciones a 1 ms, y hay una regla
  aprendida en `add-landing-page`: **eso no basta**. Una animación necesita declarar su estado final,
  no correr más deprisa.
- **`SelectableProfile` ya trae `familyRole`.** El adulto se puede distinguir sin pedir nada nuevo.
- **Dos tests cazan colores literales y valores arbitrarios de Tailwind** en las pantallas vestidas, y
  la rejilla ya está fuera de la lista de deuda.

## Goals / Non-Goals

**Goals:**

- Que la rejilla tenga presencia de portada y no de lista de contactos.
- Que se vea de un vistazo cuál es el perfil del adulto, y que también se oiga.
- Que las teselas respondan al puntero sin imponer movimiento a quien no lo quiere.

**Non-Goals:**

- Enseñar el saldo. Ver el «No incluye» de la proposal.
- Cambiar la forma del avatar en el resto de la aplicación.

## Decisions

### 1. La forma es una opción de la pieza, no una clase desde fuera

**Elegido**: `shape?: "circle" | "rounded"` en `Avatar`, con `circle` por defecto.

**Descartado — pasar el radio en `className`**: parece más barato y es un fallo latente.

```
   <Avatar className="rounded-2xl" />
        │
        ▼
   cx("… rounded-full …", "rounded-2xl")
        │
        ▼
   dos utilidades del mismo grupo, misma especificidad
        │
        ▼
   gana la que Tailwind ponga DESPUÉS en la hoja generada
```

Y eso no lo decide el punto de uso, ni se ve leyendo el código, ni tiene por qué ser estable entre
compilaciones. `cx` cabe en tres líneas a propósito y no es `twMerge`; la respuesta correcta en este
sistema es que la pieza declare sus variantes.

**El valor por defecto no cambia**, así que las cinco pantallas que usan `Avatar` hoy siguen igual sin
tocar ni una.

**Nota de honestidad**: el design de `redesign-profile-grid` descartó a conciencia darle forma a
`Avatar`, y aquello fue correcto **con la pregunta de entonces** —¿círculo o cuadrado?, respondida
«círculo»—. La pregunta ahora es otra y la respuesta también. No es una regresión: es que cambió lo
que se pide.

### 2. El adulto se marca con una corona, y la corona TIENE NOMBRE

**Elegido**: un distintivo pequeño en una esquina de la tesela, anunciado como «Adulto».

**Por qué con nombre y no decorativo**: un icono suelto hay que aprenderlo, y quien no ve la pantalla
no lo aprende nunca. El nombre accesible de la tesela pasa a llevar el rol dentro, así que la
distinción existe en los dos canales o no existe.

**Por qué en la esquina y no bajo el nombre**: bajo el nombre habría hecho que la tesela del padre
fuese más alta que las demás. Sin línea de saldo —que se dejó fuera— no hay nada más que ocupe esa
línea, así que la esquina sale gratis y todas las teselas quedan a la misma altura.

### 3. El crecimiento al señalar va bajo `motion-safe`, no bajo una duración corta

```
   mal                              bien
   ───                              ────
   hover:scale-105                  motion-safe:hover:scale-105
   + duración a 1ms                 + realce por COLOR siempre
     bajo movimiento reducido
   → el salto ocurre igual,         → con movimiento reducido no
     solo que de golpe                se mueve nada, y sigue
                                      respondiendo
```

El bloque de movimiento reducido del sistema pone las duraciones a 1 ms, y eso convierte un
crecimiento suave en un salto instantáneo — que es **más** molesto para quien pidió no ver
movimiento, no menos. Es la misma lección que dejó `add-landing-page`: hace falta el estado final, no
la misma animación más rápida.

El realce que **no** es movimiento —el fondo— se queda encendido en los dos casos, así que la tesela
nunca deja de responder.

## Risks / Trade-offs

- **Teselas de 9 rem en 390 px** → Dos por fila es lo que hay que proteger, y el margen es estrecho:
  9 rem de avatar más el relleno tiene que caber en la mitad del ancho útil. Se mide, no se deduce.
- **`Avatar` gana una prop** → Es una pieza compartida y cada prop es una decisión más en cada uso. Se
  acepta porque la alternativa no funciona de forma fiable, no por gusto.
- **Un icono nuevo que aprender** → Por eso lleva nombre.

## Migration Plan

1. La variante de forma en `Avatar`, sin cambiar el valor por defecto, y al catálogo.
2. La rejilla la pide, con 9 rem, y se mide el móvil.
3. La corona con su nombre.
4. El realce al señalar, con su comportamiento bajo movimiento reducido.

**Vuelta atrás**: la rejilla deja de pedir forma y vuelve al círculo.

## Open Questions

Ninguna.

## Decisiones que este change NO toma

- **Si el saldo debe verse antes de entrar.** Se preguntó y la respuesta fue que no, con el requisito
  cerrado intacto. El argumento entero está en el «No incluye» de la proposal para no reconstruirlo.
- **Si `Avatar` debería tener más formas.** Dos bastan hoy.
