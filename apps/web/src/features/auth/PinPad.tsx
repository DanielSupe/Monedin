import { ERROR_CODES, PIN_LENGTH, type SelectableProfile } from "@monedin/contracts";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ApiRequestError } from "../../lib/http-client.js";
import { messages } from "../../lib/messages.js";
import { describeAuthError, isLockout, useEnterProfile, useProfiles } from "./use-session.js";

/**
 * Teclado de PIN de un perfil.
 *
 * Un único teclado sirve para el padre y para cualquier hijo: desde la rejilla
 * son perfiles iguales y el backend los trata igual, porque
 * `POST /auth/profiles/enter` acepta los dos. Lo que cambia es el mensaje de
 * error, ya que el código de PIN incorrecto es el mismo para ambos roles.
 *
 * Se separó de `ProfileGrid` en `add-app-shell`: ahora es un destino con su
 * propia dirección, y el perfil sale del identificador de la ruta y no de una
 * propiedad que le pasaba la rejilla.
 */
export function PinPad({ profileId }: { profileId: string }): React.ReactElement {
  const { data, isPending } = useProfiles(true);

  if (isPending) {
    return <p>{messages.health.loading}</p>;
  }

  const profile = data?.profiles.find((candidate) => candidate.id === profileId);

  /*
   * Un identificador que no está en la rejilla: un enlace viejo, un hijo dado de
   * baja, o alguien tecleando. Se ofrece la vuelta en vez de dejar la pantalla
   * en blanco, que es lo que pide la spec.
   */
  if (profile === undefined) {
    return (
      <section>
        <p>{messages.auth.profileNotFound}</p>
        <Link to="/profiles">{messages.auth.back}</Link>
      </section>
    );
  }

  // Con clave por perfil, cambiar de perfil reinicia el PIN tecleado en vez de
  // arrastrarlo al siguiente.
  return <Keypad key={profile.id} profile={profile} />;
}

function Keypad({ profile }: { profile: SelectableProfile }): React.ReactElement {
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
          // Al entrar, el actor existe y la guarda de esta ruta reevaluada manda
          // sola al inicio. Aquí solo se limpia el teclado si falla.
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

      {/* Solo para el perfil del padre: es su vía de rescate. */}
      {isParent && (
        <p style={{ marginTop: "1rem" }}>
          <Link to="/profiles/reset-pin">{messages.auth.forgotPin}</Link>
        </p>
      )}

      <p style={{ marginTop: "1rem" }}>
        <Link to="/profiles">{messages.auth.back}</Link>
      </p>
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
function describeProfileEnterError(
  error: unknown,
  familyRole: SelectableProfile["familyRole"],
): string {
  const isAdult = familyRole === "PARENT";

  if (isLockout(error)) {
    return isAdult ? messages.auth.adultPinLocked : messages.auth.pinLocked;
  }
  if (error instanceof ApiRequestError && error.code === ERROR_CODES.UNAUTHORIZED) {
    return isAdult ? messages.auth.adultPinWrong : messages.auth.pinWrong;
  }
  return describeAuthError(error);
}
