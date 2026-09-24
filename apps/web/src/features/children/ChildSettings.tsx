import { PIN_LENGTH, changeOwnChildPinSchema } from "@monedin/contracts";
import { useState } from "react";
import { MY_PIN_EXPLAINER, messages } from "../../lib/messages.js";
import { contar } from "../../lib/plural.js";
import { LeaveProfile } from "../auth/LeaveProfile.js";
import { describeAuthError, useChangeOwnChildPin } from "../auth/use-session.js";
import * as childrenApi from "../../api/children.js";
import { Alert, Avatar, Button, Card, Coins, Field, Input, Skeleton } from "../../ui/index.js";
import { AvatarPicker } from "../profiles/AvatarPicker.js";
import { ReplayTour } from "../tutorial/ReplayTour.js";
import { describeChildrenError, useOwnChild, useUpdateOwnChild } from "./use-children.js";

export function ChildSettings(): React.ReactElement {
  const { data, isPending, error } = useOwnChild();
  const updateAvatar = useUpdateOwnChild();

  if (isPending) {
    return <Skeleton lines={4} />;
  }

  if (error || data === undefined) {
    return <Alert tone="danger">{describeChildrenError(error)}</Alert>;
  }

  return (
    <section className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-1">

        <span className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
          {messages.children.myProfileLead}
        </span>
        <h2 className="text-display font-extrabold">{messages.children.myProfileTitle}</h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex items-center gap-4">
              <Avatar value={data.avatar} size="large" alt={data.name} />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-title font-extrabold">{data.name}</p>
                {data.age !== null && (
                  <p className="text-small font-bold text-ink-muted">
                    {contar(data.age, messages.children.yearsOne, messages.children.yearsMany)}
                  </p>
                )}
                <Coins amount={data.coins} />
              </div>
            </div>
          </Card>

          <AvatarPicker
            value={data.avatar}
            onChange={(avatar) => updateAvatar.mutate({ avatar })}
            label={messages.children.chooseAvatar}
            requestUploadUrl={childrenApi.requestOwnAvatarUploadUrl}
            onUpload={(avatarUploadKey) => updateAvatar.mutate({ avatarUploadKey })}
          />

          {updateAvatar.isSuccess && <Alert tone="done">{messages.children.avatarSaved}</Alert>}
          {updateAvatar.error !== null && (
            <Alert tone="danger">{describeChildrenError(updateAvatar.error)}</Alert>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <OwnPinForm />
          <ReplayTour />
        </div>
      </div>

      <div className="flex justify-center">
        <LeaveProfile />
      </div>
    </section>
  );
}

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
    <Card>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <h3 className="text-lead font-extrabold">{messages.children.changeMyPin}</h3>

        <p className="text-small text-ink-muted">{MY_PIN_EXPLAINER}</p>

        <Field label={messages.auth.currentPin}>
          <Input
            type="password"
            inputMode="numeric"
            maxLength={PIN_LENGTH}
            value={currentPin}
            onChange={(event) => setCurrentPin(event.target.value)}
            autoComplete="off"
          />
        </Field>

        <Field label={messages.auth.newPin}>
          <Input
            type="password"
            inputMode="numeric"
            maxLength={PIN_LENGTH}
            value={newPin}
            onChange={(event) => setNewPin(event.target.value)}
            autoComplete="off"
          />
        </Field>

        <Button type="submit" variant="primary" pending={change.isPending}>
          {change.isPending ? messages.children.working : messages.auth.changePinSubmit}
        </Button>

        {change.isSuccess && <Alert tone="done">{messages.auth.pinChanged}</Alert>}
        {error !== undefined && <Alert tone="danger">{error}</Alert>}
      </form>
    </Card>
  );
}
