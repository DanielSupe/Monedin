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
 * No declara escala. La escala la elige la audiencia, y aquí todavía no se sabe
 * quién está delante: la rejilla la usan el padre y los hijos por igual. Se
 * queda con la base, que es la del padre.
 *
 * Quiénes lo reciben NO se lista en ninguna parte: es la última rama de la
 * raíz, o sea todo lo que llega sin actor y sin pedir ancho completo. Como
 * todas las rutas de la aplicación exigen actor, ese conjunto es exactamente el
 * camino de entrada, y una pantalla nueva lo hereda sin que nadie se acuerde.
 * Ver la decisión 2 del design.
 */
export function EntryShell(): React.ReactElement {
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink">
      <header className="px-4 py-3">
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
      <main className="flex w-full flex-1 items-center justify-center px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
