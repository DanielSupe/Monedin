import { PIN_LENGTH, changeOwnChildPinSchema } from "@monedin/contracts";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { LeaveProfile } from "../auth/LeaveProfile.js";
import { describeAuthError, useChangeOwnChildPin } from "../auth/use-session.js";
import * as childrenApi from "../../api/children.js";
import { Alert, Avatar, Button, Card, Coins, Field, Input, Skeleton } from "../../ui/index.js";
import { AvatarPicker } from "../profiles/AvatarPicker.js";
import { ReplayTour } from "../tutorial/ReplayTour.js";
import { describeChildrenError, useOwnChild, useUpdateOwnChild } from "./use-children.js";

/**
 * Lo que un niño ve y puede cambiar de lo suyo.
 *
 * SIN enlace de «volver», y las tareas tampoco lo llevan ya: el marco del niño
 * tiene una barra abajo con sus cuatro destinos, así que un enlace dentro de
 * cada pantalla repetía lo que el marco ya hace y ocupaba sitio al final de un
 * desplazamiento. Ver la decisión 6 del design de `redesign-child-tasks`.
 *
 * Dos módulos en una pantalla, a propósito: el avatar es de `children` y el PIN
 * de `auth`, porque tocar una credencial es suyo. Para el niño es una sola cosa
 * —«mi perfil»— y no tiene por qué enterarse de la frontera.
 */
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
    <section className="mx-auto flex w-full max-w-dialog flex-col gap-4">
      <h2 className="text-title font-bold">{messages.children.myProfileTitle}</h2>

      <Card>
        <div className="flex items-center gap-4">
          <Avatar value={data.avatar} size="large" alt={data.name} />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-title font-bold">{data.name}</p>
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

      {updateAvatar.isSuccess && <Alert tone="success">{messages.children.avatarSaved}</Alert>}
      {updateAvatar.error !== null && (
        <Alert tone="danger">{describeChildrenError(updateAvatar.error)}</Alert>
      )}

      <OwnPinForm />

      <ReplayTour />

      {/*
        Salir del perfil vive TAMBIÉN aquí, y no solo al final del inicio.

        «Mi perfil» es la pantalla que responde a «esto es mío», así que es
        donde se busca dejar de ser quien se es — y es la que el marco alcanza a
        cualquier hora sin volver al inicio. Que esté en dos sitios es la misma
        forma que ya tiene el padre, con `LeaveProfile` en su inicio y `SignOut`
        en su cuenta.

        No cuenta como un destino repetido: salir es una acción sobre la sesión,
        sin dirección propia, y ni siquiera navega. Ver la decisión 1 del design
        de `polish-profile-and-reward-image`.
      */}
      <div className="flex justify-center">
        <LeaveProfile />
      </div>
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
    <Card>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <h3 className="text-body font-bold">{messages.children.changeMyPin}</h3>

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

        {change.isSuccess && <Alert tone="success">{messages.auth.pinChanged}</Alert>}
        {error !== undefined && <Alert tone="danger">{error}</Alert>}
      </form>
    </Card>
  );
}
