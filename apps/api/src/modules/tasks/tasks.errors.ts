import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../shared/errors/domain-errors.js";
import { messages } from "../../shared/messages/index.js";

export class TaskNotFoundError extends NotFoundError {
  constructor() {
    super(messages.tasks.notFound);
  }
}

export class TaskNotEditableError extends ConflictError {
  constructor() {
    super(messages.tasks.notEditable);
  }
}

export class TaskTransitionConflictError extends ConflictError {
  constructor() {
    super(messages.tasks.transitionConflict);
  }
}

export class ParentRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.tasks.parentRoleRequired);
  }
}

export class ChildRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.tasks.childRoleRequired);
  }
}

export class InvalidEvidenceUploadError extends ValidationError {
  constructor() {
    super(
      [{ field: "evidenceUploadKey", code: "invalid_upload", message: messages.tasks.invalidEvidenceUpload }],
      messages.tasks.invalidEvidenceUpload,
    );
  }
}
