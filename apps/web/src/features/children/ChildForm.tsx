import {
  CHILD_AGE_MAX,
  CHILD_AGE_MIN,
  PIN_LENGTH,
  type Child,
  createChildSchema,
  isAvatarKey,
  type ImageContentType,
  updateChildSchema,
} from "@monedin/contracts";
import { type ReactNode, useState } from "react";
import * as childrenApi from "../../api/children.js";
import { alertToneFor } from "../../lib/alert-tone.js";
import { PIN_LABEL, messages } from "../../lib/messages.js";
import { contar } from "../../lib/plural.js";
import { Alert, Avatar, Badge, Button, Card, Coins, Field, Input } from "../../ui/index.js";
import { AvatarPicker } from "../profiles/AvatarPicker.js";
import { describeChildrenError, useCreateChild, useUpdateChild } from "./use-children.js";

export function ChildForm({
  child,
  onSaved,
  cancel,
}: {
  child?: Child;

  onSaved: () => void;

  cancel: ReactNode;
}): React.ReactElement {
  const editing = child !== undefined;

  const [name, setName] = useState(child?.name ?? "");
  const [pin, setPin] = useState("");
  const [age, setAge] = useState(
    child?.age === null || child?.age === undefined ? "" : String(child.age),
  );

  const [avatar, setAvatar] = useState<string | undefined>(child?.avatar);
  const [fieldError, setFieldError] = useState<string | undefined>();

  const create = useCreateChild();
  const update = useUpdateChild();
  const mutation = editing ? update : create;

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    setFieldError(undefined);

    const edad = age.trim() === "" ? undefined : Number(age);

    const avatarDelCatalogo = isAvatarKey(avatar) ? avatar : undefined;

    if (editing) {
      const parsed = updateChildSchema.safeParse({
        name,
        age: edad ?? null,
        ...(avatarDelCatalogo === undefined ? {} : { avatar: avatarDelCatalogo }),
      });
      if (!parsed.success) {
        setFieldError(parsed.error.issues[0]?.message);
        return;
      }
      update.mutate({ childId: child.id, input: parsed.data }, { onSuccess: onSaved });
      return;
    }

    const parsed = createChildSchema.safeParse({
      name,
      pin,
      ...(edad === undefined ? {} : { age: edad }),
      ...(avatarDelCatalogo === undefined ? {} : { avatar: avatarDelCatalogo }),
    });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    create.mutate(parsed.data, { onSuccess: onSaved });
  }

  const error = fieldError ?? (mutation.error ? describeChildrenError(mutation.error) : undefined);

  return (
    <section className="flex w-full max-w-md flex-col gap-4">

      <div className="flex flex-col gap-1">
        {editing && (
          <span className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
            {messages.children.editChildLead}
          </span>
        )}

        <h2 className="text-display font-extrabold">
          {editing ? messages.children.editChildTitle : messages.children.newChildTitle}
        </h2>
      </div>

      {editing && child !== undefined && (
        <div className="flex flex-wrap items-center gap-3">
          <Avatar value={child.avatar} size="small" />

          <span className="text-lead font-extrabold">{child.name}</span>

          {child.age !== null && (
            <span className="text-small text-ink-muted">
              {contar(child.age, messages.children.yearsOne, messages.children.yearsMany)}
            </span>
          )}

          <Coins amount={child.coins} />

          {child.locked && <Badge tone="conflict">{messages.children.locked}</Badge>}
        </div>
      )}

      <Card>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label={messages.children.name}>
            <Input
              type="text"
              value={name}
              onChange={(evento) => setName(evento.target.value)}
            />
          </Field>

          <Field label={messages.children.ageOptional}>
            <Input
              type="number"
              min={CHILD_AGE_MIN}
              max={CHILD_AGE_MAX}
              value={age}
              onChange={(evento) => setAge(evento.target.value)}
            />
          </Field>

          {!editing && (
            <Field label={PIN_LABEL} help={messages.children.pinHelp}>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={PIN_LENGTH}
                value={pin}
                onChange={(evento) => setPin(evento.target.value)}
              />
            </Field>
          )}

          <AvatarPicker
            value={avatar}
            onChange={setAvatar}
            label={messages.children.avatar}
            {...(editing ? {} : { note: messages.children.photoLater })}
            {...(editing
              ? {
                  requestUploadUrl: (contentType: ImageContentType) =>
                    childrenApi.requestChildAvatarUploadUrl(child.id, contentType),
                  onUpload: (avatarUploadKey: string) => {
                    update.mutate({ childId: child.id, input: { avatarUploadKey } });
                    setAvatar(undefined);
                  },
                }
              : {})}
          />

          {error !== undefined && (
            <Alert tone={mutation.error ? alertToneFor(mutation.error) : "danger"}>{error}</Alert>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="primary" pending={mutation.isPending}>
              {mutation.isPending
                ? messages.children.working
                : editing
                  ? messages.children.save
                  : messages.children.create}
            </Button>
            {cancel}
          </div>
        </form>
      </Card>
    </section>
  );
}
