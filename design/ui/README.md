# El rediseño de la interfaz

Las 32 pantallas de Monedín, dibujadas antes de implementarlas. Esta carpeta es la
**referencia visual**; la fuente de verdad del color y las medidas seguirá siendo
`apps/web/src/styles/tokens.css` en cuanto el rediseño se implemente.

## Qué hay aquí

```
pantallas/          Las 32 pantallas, cada una en claro y en oscuro
a-oscuro.mjs        Deriva las oscuras de las claras, y comprueba que no se separen
canvas.json         La disposición: tres páginas, y las notas de cada decisión
decisiones.md       Las seis decisiones que el rediseño obliga a tomar
tokens.md           La paleta, la escala, el mecanismo del tema y la capa de alias
piezas.md           Qué bloque es qué componente, y las cinco que hay que hacer
datos-derivados.md  Las cifras que parecen dato del producto y se componen aquí
```

## Cómo se implementa

**Primero los tokens, después las piezas, y solo entonces las pantallas.** Al
revés —traducir pantalla por pantalla— es lo que reproduce los 2 489 estilos en
línea de las maquetas, que además el lint prohíbe, y lo que hace que cada pantalla
resuelva la misma pieza de una manera distinta.

Son cinco changes de OpenSpec, en este orden:

1. **`repaint-design-system`** — tokens, escala, tema oscuro y la capa de alias.
   No toca ninguna pantalla: se repintan solas. *Escrito y validado.*
2. `add-design-pieces` — las cinco piezas de marca, lo que se trae de shadcn, y
   los doce avatares de emoji a SVG.
3. `redesign-child-screens` — las ocho del niño.
4. `redesign-parent-screens` — las doce del padre, con sus tres diálogos.
5. `redesign-entry-screens` — la puerta pública, el acceso, la rejilla y el PIN.

El primero está en `openspec/changes/repaint-design-system/`, y su `proposal.md`
declara los otros cuatro en su sección «No incluye».

## Cómo se miran

Cada `.dc.html` es HTML autocontenido con los estilos en línea: **se abre en el
navegador con un doble clic** y se ve tal cual. No necesita servidor ni compilar
nada. El `<script src="./support.js">` de la cabecera da un 404 inofensivo: solo
lo usa el editor de donde salieron.

Están pensadas para un marco de **1440 × 900**, salvo `Bienvenida.dc.html`, que
es una página larga (1440 × 2400).

## El tema oscuro: generado, versionado y comprobado

Las 32 oscuras **no se escriben a mano**: `a-oscuro.mjs` las deriva de sus
parejas claras reasignando la capa semántica. El mapa de color que lleva dentro
ES la decisión; los archivos son su consecuencia.

```bash
node design/ui/a-oscuro.mjs           # las regenera
node design/ui/a-oscuro.mjs --check   # falla si alguna se separó de su clara
```

Aun así **se versionan**, por dos razones que pesan más que la duplicación: se
abren con doble clic, sin tener node ni saber que existe un script; y en una
revisión el diff enseña a qué pantallas afecta tocar el mapa. Con solo el script,
cambiar una línea repinta 32 pantallas de forma invisible.

El precio de versionarlas es que alguien puede editar una oscura y dejarla
diciendo algo que el mapa no dice. Eso lo cierra `--check`, que regenera en
memoria y compara: si se separan, falla y nombra cuáles. Cada archivo generado
lleva además el aviso dentro, para que se lea antes de escribir en él.

Para corregir algo del oscuro: **se corrige su clara, o se corrige el mapa**.
Nunca el archivo generado.

## Lo que el oscuro NO cambia

Los tres acentos —naranja `#FF6B4A`, ámbar `#F5B93B` y el morado, solo aclarado a
`#8B6BF0`— son idénticos en los dos temas. Cambian las superficies, la tinta y los
fondos suaves, y nada más. Es lo que hace que sea el mismo producto y no dos.

Hay dos blancos que el conversor protege a propósito, y conviene saberlo antes de
tocarlo:

- **El aro que enmarca la cara del niño** sobre el panel naranja del teclado de
  PIN. No es una superficie del tema, es un marco: oscurecerlo lo hace desaparecer.
- **El trazo dentro de la moneda**, que va dibujado encima del ámbar y por eso
  tiene que seguir siendo oscuro. Si se aclarase, la moneda perdería su «M».

## Lo que estas maquetas NO son

- **No son una especificación.** Lo que se implemente se rige por el change de
  OpenSpec correspondiente y por las specs que modifique, no por este HTML.
- **No usan ningún endpoint nuevo.** Todo lo que se ve se compone con datos que la
  API ya devuelve. Donde hay agregación nueva —el anillo «2 de 5 hechas», «Tu
  próximo premio», los grupos por estado— es cálculo de cliente.
- **No están probadas en anchos reales.** Se dibujaron a 1440; el marco estrecho y
  el cajón lateral siguen siendo los que la aplicación ya monta.

## Una cosa que falta decidir

El saldo aparece en una píldora en la cabecera de las pantallas del niño.
`CLAUDE.md` dice lo contrario a propósito —«tenerlo siempre a la vista convierte
el marco en un tablero»— y esa decisión no se ha revocado con un argumento nuevo.
Está en `decisiones.md` como la única abierta.
