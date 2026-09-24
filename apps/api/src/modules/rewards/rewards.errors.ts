import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/errors/domain-errors.js";
import { messages } from "../../shared/messages/index.js";

export class RewardNotFoundError extends NotFoundError {
  constructor() {
    super(messages.rewards.notFound);
  }
}

export class ParentRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.rewards.parentRoleRequired);
  }
}

export class ChildRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.rewards.childRoleRequired);
  }
}

export class InvalidImageUploadError extends ValidationError {
  constructor() {
    super(
      [{ field: "imageUploadKey", code: "invalid_upload", message: messages.rewards.invalidImageUpload }],
      messages.rewards.invalidImageUpload,
    );
  }
}
