import { useEffect } from "react";
import type { ThemePreference } from "@monedin/contracts";

/**
 * Aplica el tema del perfil A LA RAÍZ del documento.
 *
 * A la raíz y no al contenedor del marco, y esa es la mitad importante: los
 * diálogos y el velo del recorrido salen por un PORTAL, al final del documento.
 * Con el atributo puesto más abajo se quedarían con el tema contrario, que es
 * justo el sitio donde menos se mira y más molesta.
 *
 * Con «seguir al sistema» no se escribe NADA: es la ausencia del atributo lo que
 * deja mandar a `prefers-color-scheme`. Escribir `light` en su lugar sería otra
 * cosa — un tema fijo que ya no cambia al anochecer.
 *
 * Y se limpia al salir del perfil, o la rejilla heredaría el tema del último que
 * entró — que es exactamente el problema que esta preferencia existe para evitar
 * en una tablet compartida.
 */
export function useTheme(theme: ThemePreference | undefined): void {
  useEffect(() => {
    const raiz = document.documentElement;

    if (theme === "LIGHT" || theme === "DARK") {
      raiz.setAttribute("data-theme", theme.toLowerCase());
    } else {
      raiz.removeAttribute("data-theme");
    }

    return () => {
      raiz.removeAttribute("data-theme");
    };
  }, [theme]);
}
