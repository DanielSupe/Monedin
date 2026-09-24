import { messages } from "../../shared/messages/index.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../shared/errors/domain-errors.js";

export class ChildNotFoundError extends NotFoundError {
  constructor() {
    super(messages.children.notFound);
  }
}

export class MaxChildrenReachedError extends ConflictError {
  constructor() {
    super(messages.children.maxReached);
  }
}

export class ParentRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.children.parentRoleRequired);
  }
}

export class ChildRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.children.childRoleRequired);
  }
}

export class InvalidAvatarUploadError extends ValidationError {
  constructor() {
    super(
      [{ field: "avatarUploadKey", code: "invalid_upload", message: messages.children.invalidAvatarUpload }],
      messages.children.invalidAvatarUpload,
    );
  }
}
