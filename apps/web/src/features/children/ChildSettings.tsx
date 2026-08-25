import { PIN_LENGTH, changeOwnChildPinSchema, type AvatarKey } from "@monedin/contracts";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { describeAuthError, useChangeOwnChildPin } from "../auth/use-session.js";
import { AvatarPicker } from "./AvatarPicker.js";
import { describeChildrenError, useOwnChild, useUpdateOwnChild } from "./use-children.js";

/**
 * Lo que un niño ve y puede cambiar de lo suyo.
 *
 * Dos módulos en una pantalla, a propósito: el avatar es de `children` y el PIN
 * de `auth`, porque tocar una credencial es suyo. Para el niño es una sola cosa
 * —«mi perfil»— y no tiene por qué enterarse de la frontera.
 */
export function ChildSettings({ onDone }: { onDone: () => void }): React.ReactElement {
  const { data, isPending, error } = useOwnChild();
  const updateAvatar = useUpdateOwnChild();

  if (isPending) {
    return <p>{messages.health.loading}</p>;
  }

  if (error || data === undefined) {
    return (
      <p role="alert" style={{ color: "#b00020" }}>
        {describeChildrenError(error)}
      </p>
    );
  }

  return (
    <section style={{ maxWidth: "24rem" }}>
      <h2>{messages.children.myProfileTitle}</h2>

      <p style={{ fontSize: "1.25rem" }}>
        <strong>{data.name}</strong>
      </p>
      <p>
        {messages.children.myCoins}: <strong>{data.coins}</strong>
      </p>

      <AvatarPicker
        value={data.avatar as AvatarKey}
        onChange={(avatar) => updateAvatar.mutate({ avatar })}
        label={messages.children.chooseAvatar}
      />

      {updateAvatar.isSuccess && <p>{messages.children.avatarSaved}</p>}
      {updateAvatar.error !== null && (
        <p role="alert" style={{ color: "#b00020" }}>
          {describeChildrenError(updateAvatar.error)}
        </p>
      )}

      <OwnPinForm />

      <button type="button" onClick={onDone} style={{ marginTop: "1rem" }}>
        {messages.children.back}
      </button>
    </section>
  );
}

/** Cambiar el PIN propio exige saber el actual. Fallarlo cuenta para el bloqueo. */
function OwnPinForm(): React.ReactElement {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const change = useChangeOwnChildPin();

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    setFieldError(undefined);

    const parsed = changeOwnChildPinSchema.safeParse({ currentPin, newPin });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }

    change.mutate(parsed.data, {
      onSuccess: () => {
        setCurrentPin("");
        setNewPin("");
      },
    });
  }

  const error = fieldError ?? (change.error ? describeAuthError(change.error) : undefined);

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: "0.5rem", marginTop: "1rem" }}>
      <h3>{messages.children.changeMyPin}</h3>

      <label>
        {messages.auth.currentPin}
        <input
          type="text"
          inputMode="numeric"
          maxLength={PIN_LENGTH}
          value={currentPin}
          onChange={(event) => setCurrentPin(event.target.value)}
          style={{ display: "block", width: "100%" }}
        />
      </label>

      <label>
        {messages.auth.newPin}
        <input
          type="text"
          inputMode="numeric"
          maxLength={PIN_LENGTH}
          value={newPin}
          onChange={(event) => setNewPin(event.target.value)}
          style={{ display: "block", width: "100%" }}
        />
      </label>

      <button type="submit" disabled={change.isPending}>
        {change.isPending ? messages.children.working : messages.auth.changePinSubmit}
      </button>

      {change.isSuccess && <p>{messages.auth.pinChanged}</p>}
      {error !== undefined && (
        <p role="alert" style={{ color: "#b00020" }}>
          {error}
        </p>
      )}
    </form>
  );
}
