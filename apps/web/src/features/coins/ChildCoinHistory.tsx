import { Link } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { Avatar, Coins, buttonClasses } from "../../ui/index.js";
import { useChild } from "../children/use-children.js";
import { CoinHistory } from "./CoinHistory.js";
import { useChildCoinHistory } from "./use-coins.js";

/**
 * El historial de un hijo, mirado por su padre.
 *
 * La respuesta a «este saldo no me cuadra», que hasta `add-coin-history` no
 * tenía dónde mirarse aunque la tabla llevara construida desde el principio.
 *
 * Un identificador ajeno responde 404 —nunca 403, para no confirmar que
 * existe—, y aquí eso se traduce en el aviso y la vuelta al listado.
 */
export function ChildCoinHistory({
  childId,
  page,
}: {
  childId: string;
  page: number;
}): React.ReactElement {
  const { data, isPending, error } = useChildCoinHistory(childId, { page });
  const { data: hijo } = useChild(childId);

  return (
    <div className="flex flex-col gap-4">
      {/*
        DE QUIÉN ES ESTE HISTORIAL, que la pantalla no decía.

        Es el mismo defecto que tenía la edición de un hijo: se llega desde una
        lista de tres y el título era «Historial de monedas» a secas. Su nombre
        identifica y su saldo confirma que es el que se quería — que además es el
        número que trajo a nadie hasta aquí.
      */}
      {hijo !== undefined && (
        <div className="flex flex-wrap items-center gap-3">
          <Avatar value={hijo.avatar} size="small" />
          <span className="text-lead font-extrabold">{hijo.name}</span>
          <Coins amount={hijo.coins} />
        </div>
      )}

      <CoinHistory
        title={messages.coins.parentTitle}
        note={messages.coins.ledgerNote}
        page={data}
        isPending={isPending}
        error={error}
        {...(page > 1
          ? {
              previous: (
                <Link
                  to="/children/$childId/coins"
                  params={{ childId }}
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
                  to="/children/$childId/coins"
                  params={{ childId }}
                  search={{ page: page + 1 }}
                  className={buttonClasses("secondary")}
                >
                  {messages.ui.nextPage}
                </Link>
              ),
            }
          : {})}
      />

      <Link
        to="/children"
        search={{ page: 1 }}
        className={`${buttonClasses("secondary")} self-start`}
      >
        {messages.children.back}
      </Link>
    </div>
  );
}
