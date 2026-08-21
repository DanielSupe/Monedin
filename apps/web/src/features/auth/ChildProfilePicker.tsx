import { ERROR_CODES, PIN_LENGTH, type SelectableChild } from "@monedin/contracts";
import { useState } from "react";
import { ApiRequestError } from "../../lib/http-client.js";
import { messages } from "../../lib/messages.js";
import {
  describeAuthError,
  isLockout,
  useChildProfiles,
  useEnterChildProfile,
} from "./use-session.js";

/**
 * Selector de perfil y teclado de PIN.
 *
 * Es la pantalla que ve un niño de seis años, así que el PIN se teclea con
 * botones grandes y no con un campo de texto. Lo que importa aquí, más allá del
 * aspecto, es que el bloqueo se distingue del PIN incorrecto: decirle «prueba
 * otra vez» a alguien que no puede probar es cruel y además inútil.
 */
export function ChildProfilePicker({
  onCancel,
  onEntered,
}: {
  onCancel: () => void;
  /** Se llama al conseguir la sesión del niño, para cerrar el selector. */
  onEntered: () => void;
}): React.ReactElement {
  const [selected, setSelected] = useState<SelectableChild | undefined>();
  const { data, isPending } = useChildProfiles(true);

  if (isPending) {
    return <p>{messages.health.loading}</p>;
  }

  const children = data?.children ?? [];

  if (selected !== undefined) {
    return (
      <PinPad
        child={selected}
        onEntered={onEntered}
        onBack={() => {
          setSelected(undefined);
        }}
      />
    );
  }

  return (
    <section>
      <h2>{messages.auth.whoIsPlaying}</h2>

      {children.length === 0 ? (
        <p>{messages.auth.noChildren}</p>
      ) : (
        <ul style={{ display: "flex", gap: "1rem", listStyle: "none", padding: 0, flexWrap: "wrap" }}>
          {children.map((child) => (
            <li key={child.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(child);
                }}
                disabled={child.locked}
                style={{ padding: "1rem 1.5rem", fontSize: "1.1rem" }}
              >
                {child.name}
                {child.locked && ` (${messages.auth.profileLocked})`}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={onCancel} style={{ marginTop: "1rem" }}>
        {messages.auth.back}
      </button>
    </section>
  );
}

function PinPad({
  child,
  onBack,
  onEntered,
}: {
  child: SelectableChild;
  onBack: () => void;
  onEntered: () => void;
}): React.ReactElement {
  const [pin, setPin] = useState("");
  const enter = useEnterChildProfile();

  function press(digit: string): void {
    if (pin.length >= PIN_LENGTH) return;

    const next = pin + digit;
    setPin(next);

    if (next.length === PIN_LENGTH) {
      enter.mutate(
        { childProfileId: child.id, pin: next },
        {
          // Conseguida la sesión, el selector sobra: quien lo abrió decide qué
          // se ve ahora.
          onSuccess: onEntered,
          onError: () => {
            setPin("");
          },
        },
      );
    }
  }

  // El mensaje depende del CÓDIGO del error, no de su texto. Pero el código de
  // credencial incorrecta es el mismo para una contraseña y para un PIN, así que
  // esta pantalla pone el suyo: a un niño no se le dice que su correo está mal.
  const error = enter.error ? describePinError(enter.error) : undefined;

  return (
    <section>
      <h2>
        {child.name}: {messages.auth.pinPrompt}
      </h2>

      <p aria-label="pin" style={{ fontSize: "2rem", letterSpacing: "0.5rem" }}>
        {"•".repeat(pin.length)}
        {"_".repeat(PIN_LENGTH - pin.length)}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 4rem)", gap: "0.5rem" }}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => {
              press(digit);
            }}
            disabled={enter.isPending}
            style={{ padding: "1rem", fontSize: "1.25rem" }}
          >
            {digit}
          </button>
        ))}
      </div>

      {error !== undefined && (
        <p role="alert" style={{ color: "#b00020" }}>
          {error}
        </p>
      )}

      <button type="button" onClick={onBack} style={{ marginTop: "1rem" }}>
        {messages.auth.back}
      </button>
    </section>
  );
}

/** Traduce el error de entrada al lenguaje de esta pantalla. */
function describePinError(error: unknown): string {
  if (isLockout(error)) {
    return messages.auth.pinLocked;
  }
  if (error instanceof ApiRequestError && error.code === ERROR_CODES.UNAUTHORIZED) {
    return messages.auth.pinWrong;
  }
  return describeAuthError(error);
}
