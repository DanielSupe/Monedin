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
    <section className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-1">
        {/* Qué se cambia aquí, como en las demás pantallas de ajustes. */}
        <span className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
          {messages.children.myProfileLead}
        </span>
        <h2 className="text-display font-extrabold">{messages.children.myProfileTitle}</h2>
      </div>

      {/*
        Dos columnas donde hay ancho, y una debajo de la otra donde no.

        Son dos cosas distintas —quién soy y con qué entro— y en una sola
        columna la segunda queda al final de un desplazamiento largo, después de
        doce animales. No es la misma decisión que el lateral: aquí NO se monta
        una de las dos formas, se coloca la misma en dos sitios, así que no hay
        estructura duplicada que esconder.
      */}
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
        <h3 className="text-lead font-extrabold">{messages.children.changeMyPin}</h3>

        {/*
          Qué es el PIN, antes de los dos campos. Un niño que se olvida el suyo y
          no sabe que hay salida deja de entrar, y esa mitad de la frase es la
          que ninguna pantalla decía.
        */}
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
