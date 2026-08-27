import { ERROR_CODES, PIN_LENGTH, type SelectableProfile } from "@monedin/contracts";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ApiRequestError } from "../../lib/http-client.js";
import { messages } from "../../lib/messages.js";
import { Alert, Avatar, Button, cx } from "../../ui/index.js";
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
 *
 * `manage` NO se usa aquí para navegar. Después de acertar el PIN quien navega
 * es la guarda de la ruta, que lee el mismo parámetro de la dirección; lo que
 * este componente hace con él es solo decir a dónde se va. Ver la decisión 2 del
 * design de `redesign-profile-grid`.
 */
export function PinPad({
  profileId,
  manage = false,
}: {
  profileId: string;
  manage?: boolean;
}): React.ReactElement {
  const { data, isPending } = useProfiles(true);

  if (isPending) {
    return <p className="text-body text-ink-muted">{messages.health.loading}</p>;
  }

  const profile = data?.profiles.find((candidate) => candidate.id === profileId);

  /*
   * Un identificador que no está en la rejilla: un enlace viejo, un hijo dado de
   * baja, o alguien tecleando. Se ofrece la vuelta en vez de dejar la pantalla
   * en blanco, que es lo que pide la spec.
   */
  if (profile === undefined) {
    return (
      <section className="flex flex-col items-center gap-4 py-8">
        <Alert tone="warning">{messages.auth.profileNotFound}</Alert>
        <Link to="/profiles">{messages.auth.back}</Link>
      </section>
    );
  }

  // Con clave por perfil, cambiar de perfil reinicia el PIN tecleado en vez de
  // arrastrarlo al siguiente.
  return <Keypad key={profile.id} profile={profile} manage={manage} />;
}

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

function Keypad({
  profile,
  manage,
}: {
  profile: SelectableProfile;
  manage: boolean;
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
          // Al entrar, el actor existe y la guarda de esta ruta reevaluada manda
          // sola al destino. Aquí solo se limpia el teclado si falla.
          onError: () => {
            setPin("");
          },
        },
      );
    }
  }

  /*
   * Corregir NO cuesta un intento.
   *
   * Sin esto, quien se equivoca en el segundo dígito está obligado a teclear dos
   * más y gastar un intento — y los intentos bloquean el perfil. Un error de
   * dedo se pagaba con una cuenta atrás, y para un niño eso se lee como que la
   * aplicación le echó. Solo quita un dígito antes de llegar a cuatro, que es
   * antes de que exista ningún intento.
   */
  function backspace(): void {
    setPin((actual) => actual.slice(0, -1));
  }

  const error = enter.error ? describeProfileEnterError(enter.error, profile.familyRole) : undefined;

  return (
    <section className="mx-auto flex max-w-dialog flex-col items-center gap-6 py-8">
      <Avatar value={profile.avatar} size="large" />

      <h2 className="text-title text-center font-bold">
        {profile.name}: {manage ? messages.auth.pinPromptToEdit : messages.auth.pinPrompt}
      </h2>

      <p aria-label="pin" className="text-hero flex gap-3 font-bold tabular-nums">
        {Array.from({ length: PIN_LENGTH }, (_, indice) => (
          <span
            key={indice}
            className={cx(
              "size-3 rounded-full",
              indice < pin.length ? "bg-primary" : "bg-border-strong",
            )}
          />
        ))}
      </p>

      <div className="grid grid-cols-3 gap-3">
        {DIGITS.map((digit) => (
          <Button
            key={digit}
            onClick={() => press(digit)}
            disabled={enter.isPending}
            // El cero va centrado y el borrado a su derecha, como en cualquier
            // teclado numérico: la posición de una tecla también se aprende.
            className={cx("text-title size-16", digit === "0" && "col-start-2")}
          >
            {digit}
          </Button>
        ))}

        <Button
          variant="ghost"
          onClick={backspace}
          disabled={enter.isPending || pin.length === 0}
          aria-label={messages.auth.pinDelete}
          className="size-16"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-6">
            <path
              d="M9 5h11v14H9L2 12l7-7Zm3 4 5 5m0-5-5 5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>

      {error !== undefined && <Alert tone="danger">{error}</Alert>}

      {/* Solo para el perfil del padre: es su vía de rescate. */}
      {isParent && <Link to="/profiles/reset-pin">{messages.auth.forgotPin}</Link>}

      <Link to="/profiles" search={{ manage: manage || undefined }}>
        {messages.auth.back}
      </Link>
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
