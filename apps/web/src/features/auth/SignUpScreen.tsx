import { PASSWORD_MIN_LENGTH, PIN_LENGTH, registerParentSchema } from "@monedin/contracts";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { PIN_LABEL, messages } from "../../lib/messages.js";
import { Alert, Button, Field, Input } from "../../ui/index.js";
import { AccessLayout } from "./AccessLayout.js";
import { PillField } from "./SignInScreen.js";
import { AtSign, Keypad, Lock, Person } from "./access-icons.js";
import { describeAuthError, useRegister } from "./use-session.js";

export function SignUpScreen(): React.ReactElement {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();

  const register = useRegister();

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    setFieldError(undefined);

    const parsed = registerParentSchema.safeParse({ name, email, password, pin });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    register.mutate(parsed.data);
  }

  const error = fieldError ?? (register.error ? describeAuthError(register.error) : undefined);

  return (
    <AccessLayout
      lead={messages.auth.accessSignUpLead}
      tagline={messages.auth.accessSignUpTagline}
      footer={
        <Link to="/sign-in" className="text-small">
          {messages.auth.toSignIn}
        </Link>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label={messages.auth.name}>
          <PillField icon={<Person />}>
            <Input
              shape="pill"
              type="text"
              value={name}
              onChange={(evento) => setName(evento.target.value)}
              autoComplete="name"
            />
          </PillField>
        </Field>

        <Field label={messages.auth.email}>
          <PillField icon={<AtSign />}>
            <Input
              shape="pill"
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              autoComplete="email"
            />
          </PillField>
        </Field>

        <Field
          label={messages.auth.password}
          help={`${messages.auth.passwordMinHelp} ${PASSWORD_MIN_LENGTH} ${messages.auth.passwordMinHelpTail}`}
        >
          <PillField icon={<Lock />}>
            <Input
              shape="pill"
              type="password"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              autoComplete="new-password"
            />
          </PillField>
        </Field>

        <Field label={PIN_LABEL}>
          <PillField icon={<Keypad />}>
            <Input
              shape="pill"
              type="text"
              inputMode="numeric"
              maxLength={PIN_LENGTH}
              value={pin}
              onChange={(evento) => setPin(evento.target.value)}
              autoComplete="off"
            />
          </PillField>
        </Field>

        <Alert tone="info" title={messages.auth.twoKeysTitle}>
          {messages.auth.twoKeysBody}
        </Alert>

        {error !== undefined && <Alert tone="danger">{error}</Alert>}

        <Button type="submit" variant="contrast" block pending={register.isPending}>
          {messages.auth.submitSignUp}
        </Button>
      </form>
    </AccessLayout>
  );
}
