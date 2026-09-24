import { Link } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { buttonClasses } from "../../ui/index.js";
import { CoinHistory } from "./CoinHistory.js";
import { useOwnCoinHistory } from "./use-coins.js";

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
