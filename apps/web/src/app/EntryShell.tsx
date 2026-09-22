import { Outlet } from "@tanstack/react-router";
import { Logo } from "../ui/index.js";

/**
 * El marco de las pantallas previas a tener un rol.
 *
 * Son cinco —acceso, rejilla, teclado de PIN, alta de perfil y restablecer
 * PIN—, y hasta `add-entry-frame` no tenían ninguno: caían en el contenedor de
 * lectura de la raíz, pegadas arriba y SIN MARCA. Se entraba por una página con
 * logo, se pasaba por cuatro pantallas anónimas, y el logo volvía al final.
 *
 * Declara `data-scale="entry"`, y eso CAMBIÓ en `tune-scale-to-mockups`. Antes
 * no declaraba ninguna, con el argumento de que la escala la elige la audiencia
 * y aquí todavía no se sabe quién está delante. La mitad que seguía en pie: aquí
 * no se elige entre la del padre y la del niño. La que no: sin declarar nada se
 * quedaba con la base, o sea con LA DEL PADRE —la más densa del producto—, así
 * que «no se sabe» se resolvía eligiendo al padre en silencio.
 *
 * Y sus maquetas escriben un paso entero por encima: 15 en una etiqueta de
 * campo, 22 en el nombre de un perfil, 46 en el «¿Quién eres?». Es una audiencia
 * propia, por la misma razón que la puerta pública lo es: se lee de pie, de un
 * vistazo, por alguien que todavía no es nadie en el producto.
 *
 * Quiénes lo reciben NO se lista en ninguna parte: es la última rama de la
 * raíz, o sea todo lo que llega sin actor y sin pedir ancho completo. Como
 * todas las rutas de la aplicación exigen actor, ese conjunto es exactamente el
 * camino de entrada, y una pantalla nueva lo hereda sin que nadie se acuerde.
 * Ver la decisión 2 del design.
 */
export function EntryShell(): React.ReactElement {
  return (
    <div
      data-scale="entry"
      className="relative flex min-h-dvh flex-col overflow-hidden bg-surface text-ink"
    >
      {/*
        AQUÍ HUBO DOS MANCHAS DIFUSAS Y SE QUITARON, que es lo que hay que contar.

        Las cinco pantallas del camino de entrada salían monocromas comparadas
        con sus maquetas, y el color de éstas no está en los controles sino en
        formas grandes al fondo. La copia obvia era un par de círculos enormes y
        desenfocados, como los que ya hay detrás de las órbitas de la portada.

        Sobre el crema de estas pantallas no funcionó: desenfocado y a baja
        opacidad, el violeta no se lee como ambiente sino como una mancha sucia
        en una esquina. Se vio abriendo la pantalla, que es lo único que lo podía
        decir — ningún test mira eso.

        Lo que sí arregló la pantalla fue lo de delante: el rótulo con Monedín y
        las teselas con su borde. El fondo se queda limpio a conciencia, y no como
        un olvido: media decoración es peor que ninguna.

        Y de paso quedó comprobado que la reserva del ámbar se hace cumplir. El
        segundo círculo iba a ser ámbar, como en la maqueta, y su test lo rechazó
        antes de que llegara a pantalla.
      */}
      <header className="relative px-4 py-3">
        <Logo size="medium" />
      </header>

      {/*
        `min-h-dvh` arriba y crecimiento aquí, NO una altura fija.

        Un formulario más alto que la pantalla no se puede centrar y ya está: con
        altura fija, lo que sobra se corta en silencio y no hay manera de llegar
        al botón. Así, lo corto queda centrado y lo largo crece y se desplaza.

        Y el marco NO impone ancho. Lo intentó —con el de lectura— y partía la
        rejilla en dos filas: cuatro teselas no caben en 40rem. Cada pantalla ya
        declara el suyo, porque solo ella sabe si es un formulario de 22rem o una
        fila de caras. Ver la corrección de la decisión 3 del design.
      */}
      <main className="relative flex w-full flex-1 items-center justify-center px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
