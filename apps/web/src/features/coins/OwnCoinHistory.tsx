import { Link } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { buttonClasses } from "../../ui/index.js";
import { CoinHistory } from "./CoinHistory.js";
import { useOwnCoinHistory } from "./use-coins.js";

/**
 * De dónde salieron las monedas de un niño.
 *
 * Sin selector de hijo: el perfil sale de la sesión, así que esta pantalla no
 * tiene ningún identificador que pudiera apuntar a otro niño. Es la misma
 * garantía que sus otras tres pantallas, y aquí pesa más — un historial es el
 * registro más detallado de lo que ha hecho y ha gastado, y los hermanos
 * comparten la tablet.
 */
export function OwnCoinHistory({ page }: { page: number }): React.ReactElement {
  const { data, isPending, error } = useOwnCoinHistory({ page });

  return (
    <CoinHistory
      title={messages.coins.title}
      page={data}
      isPending={isPending}
      error={error}
      {...(page > 1
        ? {
            previous: (
              <Link
                to="/me/coins"
                search={{ page: page - 1 }}
                className={buttonClasses("secondary")}
              >
                {messages.ui.previousPage}
              </Link>
            ),
          }
        : {})}
      {...(data !== undefined && page < data.totalPages
        ? {
            next: (
              <Link
                to="/me/coins"
                search={{ page: page + 1 }}
                className={buttonClasses("secondary")}
              >
                {messages.ui.nextPage}
              </Link>
            ),
          }
        : {})}
    />
  );
}
