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
import { useState } from "react";
import * as childrenApi from "../../api/children.js";
import { messages } from "../../lib/messages.js";
import { AvatarPicker } from "./AvatarPicker.js";
import { describeChildrenError, useCreateChild, useUpdateChild } from "./use-children.js";

/**
 * Alta y edición de un perfil, en un único formulario.
 *
 * Valida en el cliente con LOS MISMOS esquemas del contrato compartido que
 * aplicará la API, así que un campo mal puesto se señala sin viaje al servidor
 * y con el mismo criterio.
 *
 * El PIN solo aparece en el alta: cambiarlo después es otra operación, y de las
 * dos que hay (el padre repone, el niño cambia el suyo) ninguna encaja en un
 * formulario de datos.
 */
export function ChildForm({
  child,
  onDone,
  onCancel,
}: {
  /** Si viene, se edita; si no, se crea. */
  child?: Child;
  onDone: () => void;
  onCancel: () => void;
}): React.ReactElement {
  const editing = child !== undefined;

  const [name, setName] = useState(child?.name ?? "");
  const [pin, setPin] = useState("");
  const [age, setAge] = useState(child?.age === null || child?.age === undefined ? "" : String(child.age));
  // Puede arrancar como una URL —si el hijo ya tiene foto— o como una clave del
  // catálogo. Solo se manda al servidor cuando es una clave: una URL es lo que
  // YA está guardado, no un cambio que pedir.
  const [avatar, setAvatar] = useState<string | undefined>(child?.avatar);
  const [fieldError, setFieldError] = useState<string | undefined>();

  const create = useCreateChild();
  const update = useUpdateChild();
  const mutation = editing ? update : create;

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    setFieldError(undefined);

    // Vacío significa «sin edad», que es distinto de una edad mal escrita.
    const edad = age.trim() === "" ? undefined : Number(age);

    // Solo una clave del catálogo viaja como `avatar`. Una foto se confirma por
    // su propia vía en cuanto se sube, así que aquí nunca hay que reenviarla.
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
      update.mutate({ childId: child.id, input: parsed.data }, { onSuccess: onDone });
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
    create.mutate(parsed.data, { onSuccess: onDone });
  }

  const error = fieldError ?? (mutation.error ? describeChildrenError(mutation.error) : undefined);

  return (
    <section style={{ maxWidth: "24rem" }}>
      <h2>{editing ? messages.children.editChildTitle : messages.children.newChildTitle}</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          {messages.children.name}
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        {!editing && (
          <label>
            {messages.children.pin}
            <input
              type="text"
              inputMode="numeric"
              maxLength={PIN_LENGTH}
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              style={{ display: "block", width: "100%" }}
            />
            <small style={{ color: "#555" }}>{messages.children.pinHelp}</small>
          </label>
        )}

        <label>
          {messages.children.ageOptional}
          <input
            type="number"
            min={CHILD_AGE_MIN}
            max={CHILD_AGE_MAX}
            value={age}
            onChange={(event) => setAge(event.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        {/* Subir foto solo al EDITAR: la clave lleva dentro el identificador
            del perfil, que no existe mientras se está creando. */}
        <AvatarPicker
          value={avatar}
          onChange={setAvatar}
          label={messages.children.avatar}
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

        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? messages.children.working
            : editing
              ? messages.children.save
              : messages.children.create}
        </button>
      </form>

      {error !== undefined && (
        <p role="alert" style={{ color: "#b00020" }}>
          {error}
        </p>
      )}

      <button type="button" onClick={onCancel} style={{ marginTop: "1rem" }}>
        {messages.children.cancel}
      </button>
    </section>
  );
}
