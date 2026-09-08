## 1. La escala de apilado, y saldar la deuda que ya existía

- [x] 1.1 Declarar los dos pasos en `apps/web/src/styles/tokens.css`. **Comprobado primero**, y el
      design estaba equivocado: Tailwind 4 SÍ genera `z-*` desde `@theme` —`--z-index-sonda: 42` da
      `.z-sonda{z-index:var(--z-index-sonda)}`—, así que van en la capa 2 junto a los colores y no a
      mano con `@utility`. Design corregido. Nombrar cada paso por su PAPEL, no por su valor.
- [x] 1.2 Migrar `apps/web/src/ui/Toast.tsx` de su `z-50` a mano al token. Es la deuda que ya existía:
      si no se migra, la escala nace mintiendo en la mitad de sus entradas.
- [x] 1.3 Comentar en `tokens.css` **por qué el aviso va encima del widget**: una mascota tapada es
      inofensiva, un aviso tapado esconde información.
- [x] 1.4 Test en `apps/web/tests/ui/style-rules.test.ts`: ningún archivo fuera de `tokens.css`
      declara un orden de apilado literal. Comprobar que caza `z-50` y `z-[40]`.
- [x] 1.5 **Inyectar la violación**: devolver el `z-50` a `Toast.tsx` y ver caer 1.4. Revertir.

## 2. La pieza colapsable

- [x] 2.1 Añadir `@radix-ui/react-accordion` a `apps/web/package.json`, misma versión mayor que los
      otros tres.
- [x] 2.2 `apps/web/src/ui/Accordion.tsx`: envoltura por tokens, con su cabecera explicando por qué es
      Radix —el estado anunciado, la relación control/región, el recorrido con flechas— y por qué NO
      son `<details>`: no se animan igual entre navegadores. Que la pieza decida cuántas se abren a la
      vez, no quien la coloca.
- [x] 2.3 Exportarla desde `apps/web/src/ui/index.ts` **y añadir su entrada a `ui-catalog.tsx`**, o
      falla `tests/ui/catalog.test.ts`. Cuidado con el `Record` de variantes: el test de colores
      literales escanea el archivo entero, no solo los `className`.
- [x] 2.4 Test de la pieza en `apps/web/tests/ui/`: abre y cierra, anuncia su estado, y se recorre con
      el teclado. Montada sin proveedores, como el resto.

## 3. El widget de Monedín

- [x] 3.1 `apps/web/src/app/use-reduced-motion.ts`, hermano de `use-wide.ts`: lee `matchMedia` **de
      forma síncrona al inicializar el estado**, para que el primer pintado ya sea el correcto.
- [x] 3.2 `conMovimientoReducido()` en `apps/web/tests/setup.ts`, hermano de `conPantallaAncha()`.
- [x] 3.3 `apps/web/src/app/widget-lines.ts`: el tipo `Area`, `areaOf(pathname)` **por prefijos** —para
      que `/me/tasks` y `/tasks` caigan igual y una ruta nueva herede—, y las frases en un
      `Record<FamilyRole, Record<Area, …>>`, que es lo que impide que un área nueva compile sin cubrir
      los dos roles.
- [x] 3.4 Los textos en `messages.widget`, **sin una sola cifra dentro**. Elegir ilustraciones entre
      las doce libres de `assets/tutorial/`, y **NO usar las de emoción negativa** —`llora`, `enfado`,
      `pena`, `agobio`—: una mascota triste flotando sin motivo es peor que ninguna.
- [x] 3.5 `apps/web/src/app/MonedinWidget.tsx`: un `<Link>` con la ilustración y el bocadillo, fijo en
      la esquina con el token de apilado. **Ni Radix, ni portal, ni `role="dialog"`.** Nombre accesible
      FIJO en el enlace; la ilustración y el bocadillo, ocultos a los lectores —si el bocadillo fuera
      el nombre, el destino cambiaría de nombre cada pocos segundos—.
- [x] 3.6 La rotación: índice con transición funcional, temporizador con la constante del módulo, y
      **parado** con movimiento reducido. El fundido bajo `motion-safe:`, con un realce que no es
      movimiento encendido en los dos casos. Reiniciar índice y temporizador **al cambiar de área**.
- [x] 3.7 Montarlo en `ChildShell` y `ParentShell`, dentro del contenedor que declara la escala. Los
      dos marcos reciben `tutorialSeen` y **no lo montan mientras sea falso**. Leer antes
      `tests/app/shells.test.tsx` y `shell-scroll.test.tsx`, que montan los marcos.
- [x] 3.8 Que `areaOf` decida también **no dibujarlo en la ayuda**: dos enlaces con el mismo nombre al
      mismo destino en la misma pantalla son ruido y un `getByRole` ambiguo.
- [x] 3.9 Tests del widget: que lleva al chat; que **no expone `role="dialog"`**; que no se monta con
      el recorrido sin ver; que no aparece en la ayuda; y que las frases del padre y las del niño en la
      misma área **no son las mismas**.
- [x] 3.10 Test de la rotación **sin acumular holgura**: avanzar el tiempo EXACTO de los N pasos de una
      vez y solo después la transición. Con **tres** frases y **cuatro** intervalos, para que la
      respuesta correcta sea volver a la primera: con dos y dos, un módulo mal escrito da lo mismo que
      uno bien escrito.
- [x] 3.11 Test de movimiento reducido: diez intervalos dejan la MISMA frase. Es el que caza el defecto
      real —poner `motion-safe:` en la clase y dejar el temporizador corriendo—.
- [x] 3.12 **Inyectar la violación** de 3.11: quitar la parada del temporizador dejando el
      `motion-safe:`. Tiene que caer. Revertir.

## 4. El icono de ayuda en la cabecera

- [x] 4.1 `IconHelp` en `apps/web/src/app/nav-icons.tsx`, con el mismo helper de trazo que los otros
      seis. Un **interrogante** y no una «i»: «información» es ambiguo y esto lleva a preguntas.
- [x] 4.2 Extraer `HelpLink` junto a las demás piezas de `app/` y usarlo desde los dos marcos, entre el
      logo y el avatar. **NO extraer el `<header>` entero**, y dejar dicho por qué: las dos cabeceras
      difieren en el destino del avatar y en el fondo, así que sería el mismo `if` mudado de sitio.
- [x] 4.3 Comprobar `tests/app/sidebar.test.tsx`: la ayuda NO entra en el cajón, así que el perfil sigue
      siendo la única excepción con cifra exacta. Si el nombre accesible del widget o del icono chocara
      con un destino, ese test lo caza.
- [x] 4.4 Test: la ayuda se alcanza desde la cabecera en los dos roles, y **no aparece** en la lista de
      destinos del cajón.

## 5. Las preguntas frecuentes

- [x] 5.1 Redactar `messages.help` con las preguntas. Cubrir al menos: qué es una moneda, por qué
      aprobar es lo que paga, por qué aprobar dos veces avisa en vez de pagar dos veces, y qué hacer si
      alguien olvida su PIN.
- [x] 5.2 **Las cifras, desde sus constantes.** El test que prohíbe dígitos en el catálogo recorre los
      arrays, y estas respuestas hablan de edades y de dígitos de un PIN. Se componen una sola vez al
      final del catálogo, como `PIN_LABEL`. Es el fallo más probable de todo el change.
- [x] 5.3 `apps/web/src/features/help/HelpScreen.tsx` con el `Accordion`, y al pie «¿Más dudas?» con un
      **enlace vestido de botón** hacia el chat. Nunca un enlace envolviendo un botón.
- [x] 5.4 `apps/web/src/routes/help.tsx` con `requireActor`. El archivo monta el destino y no lo dibuja.
- [x] 5.5 Añadir `/help` al caso de destinos compartidos por los dos roles en
      `tests/app/destinations.test.tsx`, junto a `/assistant`.
- [x] 5.6 Test de la pantalla: los enunciados salen plegados, se abre uno, y el pie lleva al chat.

## 6. Comprobar y cerrar

- [x] 6.1 Typecheck y lint de `apps/web`. **No pedir una quinta excepción de estilos en línea**:
      posición fija y altura de revelación se resuelven con utilidades.
- [x] 6.2 Batería del front con `pnpm vitest run --no-file-parallelism`.
- [x] 6.3 Abrir la aplicación y mirar lo que ningún test cubre: que el widget no queda debajo del aviso
      —provocar uno con el widget en pantalla— ni al revés. **HALLAZGO**: el aviso emergente no se usa
      todavía en NINGUNA pantalla, solo en el catálogo vivo, así que la colisión era latente y no
      actual. Se comprobó por el CSS calculado: el widget resuelve a 40 desde su token y el aviso a
      50, así que el orden queda declarado antes de que alguien estrene el aviso.
- [x] 6.4 Navegar entre áreas con los dos roles y confirmar que el bocadillo cambia de conjunto y
      vuelve a empezar.
- [x] 6.5 Con movimiento reducido activo en el sistema operativo: el bocadillo no se turna.
- [x] 6.6 El acordeón a 390 px en la escala del niño, que jsdom no puede comprobar.
- [x] 6.7 Abrir pantallas del padre y del niño tras tocar `tokens.css`, para confirmar que no se
      enteraron.
- [x] 6.8 Actualizar `openspec/config.yaml` con lo que este change deja construido.

## 7. Lo que destapó mirar la aplicación

- [x] 7.1 **Los títulos de las dos pantallas nuevas estaban a `text-hero`**, y en la escala del niño
      eso son 4rem: el tamaño que el sistema reserva para el SALDO, ocupando un tercio de la pantalla
      con la palabra «Preguntas». Las quince pantallas del proyecto usan `<h2 className="text-title
      font-bold">` y estas dos eran las únicas fuera. Corregidas las dos —incluida la del chat, que
      venía con el defecto de `add-family-assistant` y solo se vio al abrirla en un móvil.
- [x] 7.2 El bocadillo alineaba al fondo con la ilustración, así que con una sola línea dejaba aire
      muerto arriba. Centrado.
