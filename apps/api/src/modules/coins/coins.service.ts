import type { CoinTransaction, Page, PaginationQuery } from "@monedin/contracts";
import type { Actor } from "../../shared/actor.js";
import { toPage, toSkipTake } from "../../shared/pagination.js";
import * as childrenService from "../children/children.service.js";
import { ChildRoleRequiredError, ParentRoleRequiredError } from "./coins.errors.js";
import * as repository from "./coins.repository.js";
import type { MovementRow } from "./coins.repository.js";

export async function listOwnHistory(
  actor: Actor,
  query: PaginationQuery,
): Promise<Page<CoinTransaction>> {
  if (actor.familyRole !== "CHILD") {
    throw new ChildRoleRequiredError();
  }

  return leer(actor.childProfileId, query);
}

export async function listChildHistory(
  actor: Actor,
  childId: string,
  query: PaginationQuery,
): Promise<Page<CoinTransaction>> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  await childrenService.getChild(actor, childId);

  return leer(childId, query);
}

async function leer(childId: string, query: PaginationQuery): Promise<Page<CoinTransaction>> {
  const result = await repository.findCoinHistoryPage(childId, toSkipTake(query));

  return toPage(query, {
    items: result.items.map(toTransaction),
    total: result.total,
  });
}

function toTransaction(row: MovementRow): CoinTransaction {
  return {
    id: row.id,
    amount: row.amount,
    balanceAfter: row.balanceAfter,
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
    taskId: row.taskId,
    redemptionId: row.redemptionId,
  };
}
