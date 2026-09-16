## Context

`repaint-design-system` dejó el tema oscuro construido y sin interruptor, con la
condición de salida escrita: «el día que se quiera elegir, la preferencia va
DENTRO del actor como `tutorialSeen` y nunca en el navegador». Este change es esa
puerta, y no reabre nada: aplica al pie de la letra lo que aquel decidió.

Las restricciones que descartan la solución directa:

1. **`localStorage` está descartado con argumento escrito.** La tablet es
   compartida; el niño heredaría el tema de su padre.
2. **Ninguna pieza conoce el tema.** El sistema reasigna la capa 2 y nada más, y
   eso no se toca: lo único que cambia es QUIÉN estampa el atributo.
3. **Hay tres estados, no dos.** «Seguir al sistema» no es lo mismo que «claro»:
   uno cambia al anochecer y el otro no.
4. **Las pantallas de entrada no tienen actor.** Lo que se elija ahí no tendría
   dónde guardarse.

## Goals / Non-Goals

**Goals**

- Que cada perfil vea su tema, en cualquier dispositivo, sin arrastrar a nadie.
- Que se pueda mirar el producto en los dos temas sin salir de él.
- Que el primer pintado ya sea el correcto: sin parpadeo de claro a oscuro.

**Non-Goals**

- Tocar una sola pieza del sistema de diseño.
- Guardar nada en el navegador.

## Decisions

### 1. El valor vive en la fila del perfil, y es un enumerado de tres

`User.themePreference` y `ChildProfile.themePreference`, con `SYSTEM` por
defecto — que es exactamente el comportamiento de hoy, así que la migración no
cambia lo que nadie ve.

**Un enumerado y no un booleano**, porque «oscuro sí/no» no sabe decir «el que
diga el sistema», y ese es el valor por defecto y el que más gente va a dejar
puesto. Con un booleano haría falta además un nulo con significado, que es la
forma de tener un enumerado sin decirlo.

**Dos columnas y no una tabla de preferencias.** Hoy hay una sola preferencia; una
tabla aparte sería una junta más en cada lectura de sesión para guardar un campo.
El día que haya una tercera preferencia, esa es la conversación.

**Alternativa descartada: guardarlo en la sesión.** La sesión muere al salir del
perfil, y entonces el tema se perdería cada vez que se cambia de perfil — que es
varias veces al día. La preferencia es de QUIÉN eres, no de esta visita.

### 2. Viaja dentro del actor

Junto a `tutorialSeen` y por el mismo argumento, que ya está escrito en
`CLAUDE.md`: el front lo necesita para decidir qué pintar nada más cargar, y un
segundo camino trae su propia caché que puede separarse de la del actor.

La consecuencia conocida: **añadir un campo obligatorio al actor rompe todos los
actores de prueba**, y eso es lo que hay que mirar. El valor por defecto en los
ayudantes compartidos es `SYSTEM`, porque el caso común de un test es alguien que
no ha tocado nada.

### 3. Un endpoint para los dos roles

`PATCH /auth/theme`, calcado de `/auth/tutorial`: mismo verbo —es un campo de
estado del perfil, como el avatar—, misma forma, y la rama por rol en el
servicio. Tener dos rutas invitaría a proteger una y olvidarse de la otra.

**NO es una ruta de solo cuenta.** Exige actor, porque hay que saber a QUIÉN se
le guarda: la lista cerrada de rutas de solo cuenta sigue en cinco.

### 4. El marco estampa, la pieza no sabe

`data-theme` en `<html>`, escrito por quien ya conoce al actor. Ninguna pieza
recibe el tema ni lo consulta, que es lo que `repaint-design-system` construyó y
lo que hace que esto sea un cambio de tres archivos y no de treinta.

**Se escribe en `<html>` y no en el contenedor del marco** porque el tema tiene
que alcanzar lo que se pinta fuera de él: los diálogos y el velo del recorrido
salen por un portal, al final del documento.

### 5. El control recorre los tres estados

Un solo botón que va sistema → claro → oscuro → sistema, y no tres controles ni
un desplegable. Es la cabecera, donde el sitio es caro, y son tres estados que se
entienden por el icono.

Su nombre accesible dice el estado ACTUAL y no el siguiente: lo que un lector
anuncia al llegar es dónde está, no a dónde iría. Y cambia con el estado, como el
de contraer el lateral.

**Alternativa descartada: ponerlo en los ajustes del perfil.** Es donde
pertenecería una preferencia por su naturaleza, y es el peor sitio para esta: hay
que entrar a un perfil, ir a sus ajustes y volver, por cada vuelta. Un control de
apariencia se usa mirando lo que cambia.

## Risks / Trade-offs

- **Un campo más en el actor rompe seis fixtures.** Se acepta: es el precio ya
  pagado con `tutorialSeen`, y el esquema de Zod los caza a todos de golpe.
- **La preferencia no aplica antes de elegir perfil.** Se acepta y se dice: ahí
  no se sabe quién está delante, y adivinarlo sería peor que seguir al sistema.
- **Dos columnas con el mismo significado en dos tablas.** Es la misma forma que
  `tutorialSeenAt`, y por la misma razón: el niño no es un `User`.

## Open Questions

- Ninguna.
