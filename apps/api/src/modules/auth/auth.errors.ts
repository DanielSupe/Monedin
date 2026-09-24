import { messages } from "../../shared/messages/index.js";
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from "../../shared/errors/domain-errors.js";

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super(messages.auth.invalidCredentials);
  }
}

export class InvalidPinError extends UnauthorizedError {
  constructor() {
    super(messages.auth.invalidPin);
  }
}

export class EmailAlreadyRegisteredError extends ConflictError {
  constructor() {
    super(messages.auth.emailTaken);
  }
}

export class ParentSessionRequiredError extends ForbiddenError {
  constructor() {
    super(messages.auth.parentSessionRequired);
  }
}

export class ChildSessionRequiredError extends ForbiddenError {
  constructor() {
    super(messages.auth.childSessionRequired);
  }
}

export class InvalidAvatarUploadError extends ValidationError {
  constructor() {
    super(
      [{ field: "avatarUploadKey", code: "invalid_upload", message: messages.auth.invalidAvatarUpload }],
      messages.auth.invalidAvatarUpload,
    );
  }
}
