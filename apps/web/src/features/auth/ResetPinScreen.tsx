import { resetAdultPinSchema } from "@monedin/contracts";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { describeAuthError, useResetAdultPin } from "./use-session.js";

/**
 * Restablece el PIN de adulto con la contraseña.
 *
 * Es la vía de rescate para un padre bloqueado fuera de su propio perfil: no
 * exige perfil activo, a propósito (decisión 3 del design de
 * `add-profile-selection`). Se abre desde el teclado de PIN del padre en la
 * rejilla.
 */
export function ResetPinScreen({ onDone }: { onDone: () => void }): React.ReactElement {
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
      <section>
        <p>{messages.auth.pinReset}</p>
        <button type="button" onClick={onDone}>
          {messages.auth.back}
        </button>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: "22rem" }}>
      <h2>{messages.auth.resetPinTitle}</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          {messages.auth.password}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
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

        <button type="submit" disabled={reset.isPending}>
          {reset.isPending ? messages.auth.working : messages.auth.resetPinSubmit}
        </button>
      </form>

      {error !== undefined && (
        <p role="alert" style={{ color: "#b00020" }}>
          {error}
        </p>
      )}

      <button type="button" onClick={onDone} style={{ marginTop: "1rem" }}>
        {messages.auth.back}
      </button>
    </section>
  );
}
