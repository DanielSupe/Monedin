import { changeAdultPinSchema } from "@monedin/contracts";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { describeAuthError, useChangeAdultPin } from "./use-session.js";

/**
 * Cambia el PIN de adulto indicando el actual.
 *
 * A diferencia de `ResetPinScreen`, exige perfil de padre activo: es la ruta
 * normal, no la de rescate. La monta `requireParent` en el servidor.
 */
export function ChangePinScreen(): React.ReactElement {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const change = useChangeAdultPin();

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    setFieldError(undefined);

    const parsed = changeAdultPinSchema.safeParse({ currentPin, newPin });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    change.mutate(parsed.data);
  }

  const error = fieldError ?? (change.error ? describeAuthError(change.error) : undefined);

  if (change.isSuccess) {
    return (
      <section>
        <p>{messages.auth.pinChanged}</p>
        <Link to="/">{messages.auth.back}</Link>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: "22rem" }}>
      <h2>{messages.auth.changePinTitle}</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          {messages.auth.currentPin}
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <label>
          {messages.auth.newPin}
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <button type="submit" disabled={change.isPending}>
          {change.isPending ? messages.auth.working : messages.auth.changePinSubmit}
        </button>
      </form>

      {error !== undefined && (
        <p role="alert" style={{ color: "#b00020" }}>
          {error}
        </p>
      )}

      <Link to="/" style={{ display: "inline-block", marginTop: "1rem" }}>
        {messages.auth.cancel}
      </Link>
    </section>
  );
}
