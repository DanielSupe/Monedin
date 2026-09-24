import { ERROR_CODES, PIN_LENGTH, type SelectableProfile } from "@monedin/contracts";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ApiRequestError } from "../../lib/http-client.js";
import { MY_PIN_EXPLAINER, messages } from "../../lib/messages.js";
import { Alert, Avatar, Button, Card, HeroPanel, Mascota, cx } from "../../ui/index.js";
import { describeAuthError, isLockout, useEnterProfile, useProfiles } from "./use-session.js";

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

  if (profile === undefined) {
    return (
      <section className="flex flex-col items-center gap-4 py-8">
        <Alert tone="conflict">{messages.auth.profileNotFound}</Alert>
        <Link to="/profiles">{messages.auth.back}</Link>
      </section>
    );
  }

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
    setPin((actual) => (actual.length >= PIN_LENGTH ? actual : actual + digit));
  }

  useEffect(() => {
    if (pin.length !== PIN_LENGTH || enter.isPending) return;

    enter.mutate(
      { profileId: profile.id, pin },
      {
        onError: () => {
          setPin("");
        },
      },
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const alTeclear = useRef<(evento: KeyboardEvent) => void>(() => {});

  alTeclear.current = (evento: KeyboardEvent): void => {
    if (enter.isPending) return;

    if (evento.key === "Backspace") {
      evento.preventDefault();
      backspace();
      return;
    }

    if (DIGITS.includes(evento.key)) {
      evento.preventDefault();
      press(evento.key);
    }
  };

  useEffect(() => {
    const oyente = (evento: KeyboardEvent): void => alTeclear.current(evento);

    document.addEventListener("keydown", oyente);
    return () => document.removeEventListener("keydown", oyente);
  }, []);

  function backspace(): void {
    setPin((actual) => actual.slice(0, -1));
  }

  const error = enter.error ? describeProfileEnterError(enter.error, profile.familyRole) : undefined;

  return (
    <section className="mx-auto flex w-full max-w-(--container-wide) flex-col items-center gap-6 py-8">
      <div className="flex w-full flex-col items-center gap-6 lg:grid lg:grid-cols-3 lg:items-center lg:gap-8">
        <Card className="flex w-full max-w-dialog flex-col items-center gap-6 p-0 lg:col-start-2 lg:justify-self-center">

        <HeroPanel className="w-full flex-col rounded-b-none text-center">
          <span className="rounded-pill relative bg-surface-raised/20 p-1.5">
            <Avatar value={profile.avatar} size="large" />
          </span>

          <p className="text-display font-extrabold text-ink-inverted">{profile.name}</p>
          <h2 className="text-body font-bold text-ink-inverted opacity-90">
            {manage ? messages.auth.pinPromptToEdit : messages.auth.pinPrompt}
          </h2>
        </HeroPanel>

      <p aria-label="pin" className="text-hero flex gap-3 font-bold tabular-nums">
        {Array.from({ length: PIN_LENGTH }, (_, indice) => (
          <span
            key={indice}
            className={cx(
              "size-3 rounded-pill",
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
            size="keypad"

            className={cx(digit === "0" && "col-start-2")}
          >
            {digit}
          </Button>
        ))}

        <Button
          variant="ghost"
          onClick={backspace}
          disabled={enter.isPending || pin.length === 0}
          aria-label={messages.auth.pinDelete}
          size="keypad"
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

      {error !== undefined && (
          <div className="w-full px-6">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        {isParent && (
          <Link to="/profiles/reset-pin" className="pb-6">
            {messages.auth.forgotPin}
          </Link>
        )}
      </Card>

        <div className="lg:col-start-3">
          <Mascota pose="duda" size="medium">
            <p className="text-small m-0 font-bold">{MY_PIN_EXPLAINER}</p>
          </Mascota>
        </div>
      </div>

      <Link to="/profiles" search={{ manage: manage || undefined }}>
        {messages.auth.back}
      </Link>
    </section>
  );
}

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
