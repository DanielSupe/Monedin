import { PIN_LENGTH, resetAdultPinSchema } from "@monedin/contracts";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { alertToneFor } from "../../lib/alert-tone.js";
import { messages } from "../../lib/messages.js";
import { Alert, Button, Card, Field, Input, buttonClasses } from "../../ui/index.js";
import { describeAuthError, useResetAdultPin } from "./use-session.js";

export function ResetPinScreen(): React.ReactElement {
  const [password, setPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const reset = useResetAdultPin();

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    setFieldError(undefined);

    const parsed = resetAdultPinSchema.safeParse({ password, newPin });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    reset.mutate(parsed.data);
  }

  const error = fieldError ?? (reset.error ? describeAuthError(reset.error) : undefined);

  if (reset.isSuccess) {
    return (
      <section className="flex w-full max-w-sm flex-col gap-4">
        <Alert tone="done">{messages.auth.pinReset}</Alert>
        <Link to="/profiles" className={`${buttonClasses("primary")} self-start`}>
          {messages.auth.back}
        </Link>
      </section>
    );
  }

  return (
    <section className="flex w-full max-w-sm flex-col gap-4">
      <h2 className="text-display font-bold">{messages.auth.resetPinTitle}</h2>
      <p className="text-body text-ink-muted">{messages.auth.resetPinLead}</p>

      <Card>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label={messages.auth.password} help={messages.auth.resetPinPasswordHelp}>
            <Input
              type="password"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              autoComplete="current-password"
            />
          </Field>

          <Field label={messages.auth.newPin} help={messages.auth.resetPinNewPinHelp}>

            <Input
              type="text"
              inputMode="numeric"
              maxLength={PIN_LENGTH}
              value={newPin}
              onChange={(evento) => setNewPin(evento.target.value)}
            />
          </Field>

          {error !== undefined && (
            <Alert tone={reset.error ? alertToneFor(reset.error) : "danger"}>{error}</Alert>
          )}

          <Button type="submit" variant="primary" pending={reset.isPending}>
            {reset.isPending ? messages.auth.working : messages.auth.resetPinSubmit}
          </Button>
        </form>
      </Card>

      <Link to="/profiles" className="text-small self-start">
        {messages.auth.back}
      </Link>
    </section>
  );
}
