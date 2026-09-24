import { Link } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { Avatar, Coins, buttonClasses } from "../../ui/index.js";
import { useChild } from "../children/use-children.js";
import { CoinHistory } from "./CoinHistory.js";
import { useChildCoinHistory } from "./use-coins.js";

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
