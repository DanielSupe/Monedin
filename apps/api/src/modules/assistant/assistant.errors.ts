import { ServiceUnavailableError } from "../../shared/errors/domain-errors.js";
import { messages } from "../../shared/messages/index.js";

export class AssistantUnavailableError extends ServiceUnavailableError {
  constructor() {
    super(messages.assistant.unavailable);
  }
}
