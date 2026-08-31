import { loginParentSchema } from "@monedin/contracts";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { Alert, Button, Field, Input } from "../../ui/index.js";
import { AccessLayout } from "./AccessLayout.js";
import { AtSign, ArrowRight, Lock } from "./access-icons.js";
import { describeAuthError, useLogin } from "./use-session.js";

/**
 * Entrar con una cuenta que ya existe.
 *
 * Antes esta pantalla era también la de registro, alternando con
 * `useState<"signIn" | "signUp">`. Eran DOS destinos decididos con estado
 * local: recargar perdía cuál era, el botón atrás sacaba de la aplicación, y
 * «Empezar» en la puerta pública abría este formulario y no el otro. Ahora cada
 * uno tiene su dirección. Ver la decisión 1 del design de `redesign-access`.
 *
 * Lo que NO cambió es el tratamiento del error, que se decide por el CÓDIGO que
 * devuelve la API y nunca por el texto del mensaje.
 */
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

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="contrast"
            iconOnly
            aria-label={messages.auth.submitSignIn}
            pending={login.isPending}
          >
            <ArrowRight />
          </Button>
        </div>
      </form>
    </AccessLayout>
  );
}

/**
 * El envoltorio que coloca el icono dentro de un campo en píldora.
 *
 * El icono es DECORATIVO: lo que nombra al campo es su etiqueta, que `Field`
 * pone encima y cablea con el control. La maqueta de referencia usa solo
 * marcador de posición, y eso borra qué campo era en cuanto alguien escribe.
 */
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
