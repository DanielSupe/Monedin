import { createFileRoute } from "@tanstack/react-router";
import { requireProfileChoice } from "../app/guards.js";
import { manageSearch } from "../app/search.js";
import { ProfileGrid } from "../features/auth/ProfileGrid.js";

/**
 * La rejilla «¿quién eres?».
 *
 * Es de SOLO CUENTA: la cookie de cuenta certifica que el dispositivo pertenece
 * a una familia, y aquí todavía no hay actor. Entrar a un perfil es lo que lo
 * crea, así que exigirlo de antemano dejaría a la familia sin puerta.
 *
 * Y **sin actor todavía**, que es lo que exige `requireProfileChoice`. Con
 * `requireAccount` la rejilla se pintaba también con un perfil ya activo, y
 * entonces las dos rutas de perfiles no decían lo mismo: la del teclado sí
 * rechaza a quien ya entró. La consecuencia se veía tocando: con Mateo dentro,
 * el lápiz sobre Lucía rebotaba a los ajustes de MATEO sin pedir el PIN de
 * Lucía. Volver a la rejilla se hace saliendo del perfil, que es lo que hace
 * «Cambiar de perfil» — y ningún marco enlaza aquí de otra forma.
 *
 * El modo de administración viaja en la dirección para que el botón atrás salga
 * del modo y no de la aplicación.
 */
export const Route = createFileRoute("/profiles/")({
  beforeLoad: ({ context }) => requireProfileChoice(context.queryClient),
  validateSearch: manageSearch,
  component: ProfileGridRoute,
});

function ProfileGridRoute(): React.ReactElement {
  const { manage } = Route.useSearch();

  return <ProfileGrid manage={manage ?? false} />;
}
