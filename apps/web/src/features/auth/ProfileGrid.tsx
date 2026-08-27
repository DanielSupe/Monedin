import { ERROR_CODES, PIN_LENGTH, type SelectableProfile } from "@monedin/contracts";
import { useState } from "react";
import { ApiRequestError } from "../../lib/http-client.js";
import { messages } from "../../lib/messages.js";
import { CreateProfileScreen } from "../children/CreateProfileScreen.js";
import { Avatar } from "../../ui/Avatar.js";
import { ResetPinScreen } from "./ResetPinScreen.js";
import { describeAuthError, isLockout, useEnterProfile, useProfiles } from "./use-session.js";

/**
 * Rejilla de perfiles. Es la ruta raíz del front (decisión 7 del design de
 * `add-profile-selection`): se ve con cuenta acreditada y sin perfil elegido,
 * y no cuelga de dentro de la aplicación como hacía el selector de niños de
 * `add-authentication`.
 *
 * Un único teclado de PIN sirve para el padre y para cualquier hijo: desde
 * aquí son perfiles iguales, y el backend los trata igual
 * (`POST /auth/profiles/enter` acepta los dos). Lo que cambia es el mensaje
 * de error, porque el código de PIN incorrecto es el mismo para los dos
 * roles.
 */
type View =
  | { name: "grid" }
  | { name: "pin"; profile: SelectableProfile }
  | { name: "create" }
  | { name: "reset" };

export function ProfileGrid(): React.ReactElement {
  const [view, setView] = useState<View>({ name: "grid" });
  const { data, isPending } = useProfiles(true);

  if (view.name === "create") {
    return <CreateProfileScreen onDone={() => setView({ name: "grid" })} />;
  }

  if (view.name === "reset") {
    return <ResetPinScreen onDone={() => setView({ name: "grid" })} />;
  }

  if (view.name === "pin") {
    return (
      <PinPad
        profile={view.profile}
        onBack={() => setView({ name: "grid" })}
        onForgotPin={() => setView({ name: "reset" })}
      />
    );
  }

  if (isPending) {
    return <p>{messages.health.loading}</p>;
  }

  const profiles = data?.profiles ?? [];

  return (
    <section>
      <h2>{messages.auth.whoIsPlaying}</h2>

      <ul style={{ display: "flex", gap: "1rem", listStyle: "none", padding: 0, flexWrap: "wrap" }}>
        {profiles.map((profile) => (
          <li key={profile.id}>
            <button
              type="button"
              onClick={() => setView({ name: "pin", profile })}
              disabled={profile.locked}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.25rem",
                padding: "1rem 1.5rem",
                fontSize: "1.1rem",
              }}
            >
              <Avatar value={profile.avatar} size="medium" />
              <span>
                {profile.name}
                {profile.locked && ` (${messages.auth.profileLocked})`}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <button type="button" onClick={() => setView({ name: "create" })} style={{ marginTop: "1rem" }}>
        {messages.auth.createProfile}
      </button>
    </section>
  );
}

function PinPad({
  profile,
  onBack,
  onForgotPin,
}: {
  profile: SelectableProfile;
  onBack: () => void;
  /** Solo se ofrece para el perfil del padre: es su vía de rescate. */
  onForgotPin: () => void;
}): React.ReactElement {
  const [pin, setPin] = useState("");
  const enter = useEnterProfile();
  const isParent = profile.familyRole === "PARENT";

  function press(digit: string): void {
    if (pin.length >= PIN_LENGTH) return;

    const next = pin + digit;
    setPin(next);

    if (next.length === PIN_LENGTH) {
      enter.mutate(
        { profileId: profile.id, pin: next },
        {
          onError: () => {
            setPin("");
          },
        },
      );
    }
  }

  const error = enter.error ? describeProfileEnterError(enter.error, profile.familyRole) : undefined;

  return (
    <section>
      <h2>
        {profile.name}: {messages.auth.pinPrompt}
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
            onClick={() => press(digit)}
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

      {isParent && (
        <button
          type="button"
          onClick={onForgotPin}
          style={{ marginTop: "1rem", background: "none", border: "none", textDecoration: "underline", padding: 0 }}
        >
          {messages.auth.forgotPin}
        </button>
      )}

      <button type="button" onClick={onBack} style={{ marginTop: "1rem", display: "block" }}>
        {messages.auth.back}
      </button>
    </section>
  );
}

/**
 * Traduce el error de entrada al lenguaje de quien lo ve.
 *
 * El código de PIN incorrecto es el mismo para el padre y para un hijo, pero
 * decírselo con el mismo texto no vale: a un niño no se le dice «restablece
 * tu PIN con tu contraseña», y un padre no necesita que le digan que pida
 * ayuda a un adulto.
 */
function describeProfileEnterError(error: unknown, familyRole: SelectableProfile["familyRole"]): string {
  const isAdult = familyRole === "PARENT";

  if (isLockout(error)) {
    return isAdult ? messages.auth.adultPinLocked : messages.auth.pinLocked;
  }
  if (error instanceof ApiRequestError && error.code === ERROR_CODES.UNAUTHORIZED) {
    return isAdult ? messages.auth.adultPinWrong : messages.auth.pinWrong;
  }
  return describeAuthError(error);
}
