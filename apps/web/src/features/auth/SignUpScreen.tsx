import { PASSWORD_MIN_LENGTH, PIN_LENGTH, registerParentSchema } from "@monedin/contracts";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { Alert, Button, Field, Input } from "../../ui/index.js";
import { AccessLayout } from "./AccessLayout.js";
import { PillField } from "./SignInScreen.js";
import { ArrowRight, AtSign, Keypad, Lock, Person } from "./access-icons.js";
import { describeAuthError, useRegister } from "./use-session.js";

/**
 * Crear una cuenta. Su propio destino desde `redesign-access`.
 *
 * Aquí llega quien pulsa «Empezar» en la puerta pública. Antes ese botón abría
 * el formulario de ENTRAR, así que quien venía a registrarse aterrizaba en un
 * acceso que no podía usar y la salida solo aparecía leyendo un enlace al pie.
 *
 * Dos cosas que esta pantalla dice y la anterior no decía:
 *
 * 1. El mínimo de la contraseña, ANTES de intentar enviarla. Se descubría
 *    fallando, y de uno en uno, porque el formulario enseña `issues[0]`.
 * 2. Por qué hay dos credenciales. Sin decirlo, pedir dos claves distintas en
 *    la misma pantalla parece un error del producto.
 */
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

        {/*
          El mínimo sale de la constante del CONTRATO y no escrito a mano: es el
          mismo número que valida la API, y tenerlo en dos sitios acaba con uno
          de los dos mintiendo.
        */}
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

        <Field label={messages.auth.pin}>
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

        {/* Por qué son dos. Va junto a las dos, no colgando de la segunda. */}
        <Alert tone="info" title={messages.auth.twoKeysTitle}>
          {messages.auth.twoKeysBody}
        </Alert>

        {error !== undefined && <Alert tone="danger">{error}</Alert>}

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            iconOnly
            aria-label={messages.auth.submitSignUp}
            pending={register.isPending}
          >
            <ArrowRight />
          </Button>
        </div>
      </form>
    </AccessLayout>
  );
}
