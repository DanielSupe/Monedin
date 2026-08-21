import { loginParentSchema, registerParentSchema } from "@monedin/contracts";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { describeAuthError, useLogin, useRegister } from "./use-session.js";

/**
 * Acceso y registro del padre.
 *
 * Andamio funcional, sin sistema de diseño: eso es otro change. Lo que sí tiene
 * que estar bien es el tratamiento del error, que se decide por el CÓDIGO que
 * devuelve la API y no por el texto del mensaje.
 */
export function SignInScreen(): React.ReactElement {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();

  const login = useLogin();
  const register = useRegister();
  const active = mode === "signIn" ? login : register;

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    setFieldError(undefined);

    if (mode === "signIn") {
      const parsed = loginParentSchema.safeParse({ email, password });
      if (!parsed.success) {
        setFieldError(parsed.error.issues[0]?.message);
        return;
      }
      login.mutate(parsed.data);
      return;
    }

    const parsed = registerParentSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    register.mutate(parsed.data);
  }

  const error = fieldError ?? (active.error ? describeAuthError(active.error) : undefined);

  return (
    <section style={{ maxWidth: "22rem" }}>
      <h2>{mode === "signIn" ? messages.auth.signInTitle : messages.auth.signUpTitle}</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: "0.75rem" }}>
        {mode === "signUp" && (
          <label>
            {messages.auth.name}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              style={{ display: "block", width: "100%" }}
            />
          </label>
        )}

        <label>
          {messages.auth.email}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <label>
          {messages.auth.password}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <button type="submit" disabled={active.isPending}>
          {active.isPending
            ? messages.auth.working
            : mode === "signIn"
              ? messages.auth.signIn
              : messages.auth.signUp}
        </button>
      </form>

      {error !== undefined && (
        <p role="alert" style={{ color: "#b00020" }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signIn" ? "signUp" : "signIn");
          setFieldError(undefined);
        }}
        style={{ marginTop: "1rem", background: "none", border: "none", textDecoration: "underline", padding: 0 }}
      >
        {mode === "signIn" ? messages.auth.toSignUp : messages.auth.toSignIn}
      </button>
    </section>
  );
}
