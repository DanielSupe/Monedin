import { loginParentSchema } from "@monedin/contracts";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { Alert, Button, Field, Input } from "../../ui/index.js";
import { AccessLayout } from "./AccessLayout.js";
import { AtSign, Lock } from "./access-icons.js";
import { describeAuthError, useLogin } from "./use-session.js";

export function SignInScreen(): React.ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();

  const login = useLogin();

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    setFieldError(undefined);

    const parsed = loginParentSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    login.mutate(parsed.data);
  }

  const error = fieldError ?? (login.error ? describeAuthError(login.error) : undefined);

  return (
    <AccessLayout
      lead={messages.auth.accessSignInLead}
      tagline={messages.auth.accessSignInTagline}
      footer={
        <Link to="/sign-up" className="text-small">
          {messages.auth.toSignUp}
        </Link>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
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

        <Field label={messages.auth.password}>
          <PillField icon={<Lock />}>
            <Input
              shape="pill"
              type="password"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              autoComplete="current-password"
            />
          </PillField>
        </Field>

        {error !== undefined && <Alert tone="danger">{error}</Alert>}

        <Button type="submit" variant="contrast" block pending={login.isPending}>
          {messages.auth.submitSignIn}
        </Button>
      </form>
    </AccessLayout>
  );
}

export function PillField({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <span className="relative block">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-muted"
      >
        {icon}
      </span>
      {children}
    </span>
  );
}
