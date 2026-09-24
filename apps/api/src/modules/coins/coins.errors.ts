import { messages } from "../../shared/messages/index.js";
import { ForbiddenError, NotFoundError } from "../../shared/errors/domain-errors.js";

export class CoinHistoryNotFoundError extends NotFoundError {
  constructor() {
    super(messages.coins.notFound);
  }
}

export class ParentRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.coins.forbidden);
  }
}

export class ChildRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.coins.forbidden);
  }
}
