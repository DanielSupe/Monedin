import { ConflictError, ForbiddenError, NotFoundError } from "../../shared/errors/domain-errors.js";
import { messages } from "../../shared/messages/index.js";

export class RedemptionNotFoundError extends NotFoundError {
  constructor() {
    super(messages.redemptions.notFound);
  }
}

export class RedemptionTransitionConflictError extends ConflictError {
  constructor() {
    super(messages.redemptions.transitionConflict);
  }
}

export class InsufficientBalanceError extends ConflictError {
  constructor() {
    super(messages.redemptions.insufficientBalance);
  }
}

export class DuplicatePendingRedemptionError extends ConflictError {
  constructor() {
    super(messages.redemptions.duplicatePending);
  }
}

export class ParentRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.redemptions.parentRoleRequired);
  }
}

export class ChildRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.redemptions.childRoleRequired);
  }
}
