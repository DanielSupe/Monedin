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
  onSaved,
  cancel,
}: {
  /** Si viene, se edita; si no, se crea. */
  child?: Child;
  /**
   * El perfil quedó guardado.
   *
   * Es un evento de DOMINIO, no una orden de cerrarse: este formulario se usa
   * desde la rejilla y desde la gestión del padre, y cada una navega a un sitio
   * distinto.
   */
  onSaved: () => void;
  /**
   * Por dónde se sale sin guardar, como CONTENIDO y no como callback.
   *
   * Era `onCancel: () => void` —«ciérrame»—, que empuja la navegación a quien
   * llama. Y no puede resolverlo el propio formulario, porque se usa desde dos
   * sitios que salen a destinos distintos: la rejilla y la gestión del padre.
   * Así que lo pone quien lo usa, que es quien sabe a dónde va, igual que
   * `Pagination` recibe sus enlaces. Y de paso navegar vuelve a ser trabajo de
   * un enlace.
   */
  cancel: ReactNode;
}): React.ReactElement {
  const editing = child !== undefined;

  const [name, setName] = useState(child?.name ?? "");
  const [pin, setPin] = useState("");
  const [age, setAge] = useState(
    child?.age === null || child?.age === undefined ? "" : String(child.age),
  );
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
      {/*
        EL TÍTULO DICE QUÉ SE HACE Y UN BLOQUE APARTE DICE A QUIÉN, que es como
        lo compone la maqueta — y no lo que hice en el primer intento, que fue
        poner el nombre del hijo DE TÍTULO.

        Mirar el artboard lo corrigió: su `h1` es «Editar perfil», con un
        antetítulo que dice qué se cambia aquí, y la identidad del hijo va debajo.
        Tiene sentido: el título de una pantalla nombra la operación, no su
        argumento, y con el nombre de título la pantalla dejaba de decir para qué
        servía.

        Lo que sí faltaba —y era el defecto de verdad— es a QUIÉN se está
        editando: se llega desde una lista de caras y el formulario no lo decía en
        ninguna parte. Su nombre identifica y las dos cifras confirman que es el
        que se quería.

        `Bloqueado` va aquí como ESTADO y no como acción: explica por qué alguien
        puede haber acabado en esta pantalla. Desbloquear sigue en UN solo sitio,
        su fila de la lista — informar en dos pantallas está bien, tener la
        mutación en dos serían dos caminos.
      */}
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

          {/*
            EL PIN VA DETRÁS DE LA EDAD, como en la maqueta, y el orden dice algo:
            primero quién es —su nombre y su edad— y solo después su secreto. Al
            revés, el campo que interrumpe para inventarse cuatro cifras se cuela
            en medio de dos datos que ya se saben.
          */}
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

          {/*
            Subir foto solo al EDITAR: la clave de subida lleva dentro el
            identificador del perfil, que no existe mientras se está creando.

            Es una DEUDA CONOCIDA, no un olvido, y desde `redesign-parent-children`
            tiene dueño: un change propio, después de que la lista de deuda de
            estilos quede vacía. El dato que faltaba para elegir camino ya está
            medido: los CINCO endpoints de subida del proyecto cuelgan del
            identificador de una entidad que ya existe, así que hacerlo en un solo
            momento exige un endpoint nuevo bajo el prefijo del padre —el primer
            cambio de API de esta etapa— y una política para las fotos de quien
            sube y luego no crea.
          */}
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
