import { PIN_LENGTH, type Child } from "@monedin/contracts";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { alertToneFor } from "../../lib/alert-tone.js";
import { messages } from "../../lib/messages.js";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Coins,
  Dialog,
  EmptyState,
  Field,
  Input,
  Pagination,
  Skeleton,
  buttonClasses,
} from "../../ui/index.js";
import { useSetChildPin, useUnlockChildProfile } from "../auth/use-session.js";
import { describeChildrenError, useChildren, useDeactivateChild } from "./use-children.js";

/**
 * Gestión de los perfiles desde el lado del padre.
 *
 * Reponer el PIN y desbloquear NO son endpoints de este módulo: son los de
 * `auth` que ya existían. Cambiar una credencial y revocar sesiones es suyo.
 *
 * Era la CUARTA y última pantalla que reescribía a mano el bloque de
 * paginación. Con esta, `Pagination` tiene todos sus consumidores y no queda
 * ninguna copia.
 */
export function ChildrenList({ page }: { page: number }): React.ReactElement {
  const { data, isPending, error } = useChildren(page);

  const hijos = data?.items ?? [];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-title font-bold">{messages.children.title}</h2>
        <Link to="/children/new" className={buttonClasses("primary")}>
          {messages.children.addChild}
        </Link>
      </div>

      {isPending ? (
        <Skeleton lines={4} />
      ) : error ? (
        <Alert tone={alertToneFor(error)}>{describeChildrenError(error)}</Alert>
      ) : hijos.length === 0 ? (
        <EmptyState glyph="🧒" title={messages.children.empty} />
      ) : (
        <ul className="flex list-none flex-col gap-3 p-0">
          {hijos.map((child) => (
            <ChildRow key={child.id} child={child} />
          ))}
        </ul>
      )}

      {data !== undefined && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          {...(page > 1
            ? {
                previous: (
                  <Link
                    to="/children"
                    search={{ page: page - 1 }}
                    className={buttonClasses("secondary")}
                  >
                    {messages.ui.previousPage}
                  </Link>
                ),
              }
            : {})}
          {...(page < data.totalPages
            ? {
                next: (
                  <Link
                    to="/children"
                    search={{ page: page + 1 }}
                    className={buttonClasses("secondary")}
                  >
                    {messages.ui.nextPage}
                  </Link>
                ),
              }
            : {})}
        />
      )}
    </section>
  );
}

function ChildRow({ child }: { child: Child }): React.ReactElement {
  /* Dos revelaciones, no dos destinos: ninguna decide qué PANTALLA se enseña. */
  const [confirmando, setConfirmando] = useState(false);
  const [reponiendoPin, setReponiendoPin] = useState(false);
  const [pinNuevo, setPinNuevo] = useState("");

  const deactivate = useDeactivateChild();
  const setPin = useSetChildPin();
  const unlock = useUnlockChildProfile();

  function reponer(evento: React.FormEvent): void {
    // Un `<form>` y no un campo suelto con un botón al lado: teclear cuatro
    // dígitos y pulsar Enter es lo que hace cualquiera. Misma regla que
    // `redesign-parent-authoring` aplicó a las tres pantallas de escritura.
    evento.preventDefault();
    setPin.mutate(
      { childProfileId: child.id, pin: pinNuevo },
      {
        onSuccess: () => {
          setPinNuevo("");
          setReponiendoPin(false);
        },
      },
    );
  }

  return (
    <li>
      <Card>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Avatar value={child.avatar} size="small" />

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate text-body font-bold">{child.name}</p>
              {child.age !== null && (
                <p className="text-small text-ink-muted">
                  {messages.children.age}: {child.age}
                </p>
              )}
            </div>

            <Coins amount={child.coins} />

            {/*
              Bloqueado va en ADVERTENCIA y no en peligro. Significa que ese niño
              falló el PIN varias veces: no es una avería ni una culpa de nadie, y
              el rojo se lo diría. Mismo criterio que un canje rechazado y que un
              409. Y el tono acompaña al texto, nunca lo sustituye.
            */}
            {child.locked && <Badge tone="warning">{messages.children.locked}</Badge>}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/children/$childId/edit"
              params={{ childId: child.id }}
              className={buttonClasses("secondary")}
            >
              {messages.children.edit}
            </Link>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setReponiendoPin((abierto) => !abierto)}
            >
              {messages.children.resetPin}
            </Button>

            {/* Solo si lo está: ofrecer desbloquear un perfil que no está
                bloqueado es prometer algo que no hace nada. */}
            {child.locked && (
              <Button
                type="button"
                variant="secondary"
                pending={unlock.isPending}
                onClick={() => unlock.mutate(child.id)}
              >
                {messages.children.unlock}
              </Button>
            )}

            <Button type="button" variant="danger" onClick={() => setConfirmando(true)}>
              {messages.children.deactivate}
            </Button>
          </div>

          {unlock.error !== null && (
            <Alert tone={alertToneFor(unlock.error)}>{describeChildrenError(unlock.error)}</Alert>
          )}

          {reponiendoPin && (
            <form onSubmit={reponer} className="flex flex-col gap-3 border-t border-border pt-3">
              <Field label={messages.children.pin} help={messages.children.pinHelp}>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={PIN_LENGTH}
                  value={pinNuevo}
                  onChange={(evento) => setPinNuevo(evento.target.value)}
                  className="w-32"
                />
              </Field>

              {setPin.error !== null && (
                <Alert tone={alertToneFor(setPin.error)}>
                  {describeChildrenError(setPin.error)}
                </Alert>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="primary" pending={setPin.isPending}>
                  {messages.children.save}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setReponiendoPin(false)}
                >
                  {messages.children.cancel}
                </Button>
              </div>
            </form>
          )}

          {/*
            La baja va en un DIÁLOGO, y el argumento es la asimetría: retirar un
            premio se revierte publicándolo otra vez y ya se pregunta con uno;
            dar de baja un perfil NO se deshace y se preguntaba con un párrafo y
            dos botones sueltos dentro de la fila. En una tablet que se usa con el
            dedo, eso deja una acción destructiva a un toque de la fila de al
            lado.
          */}
          <Dialog
            open={confirmando}
            onOpenChange={setConfirmando}
            title={messages.children.deactivate}
            description={messages.children.deactivateConfirm}
            footer={
              <>
                <Button type="button" variant="secondary" onClick={() => setConfirmando(false)}>
                  {messages.children.cancel}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  pending={deactivate.isPending}
                  onClick={() =>
                    deactivate.mutate(child.id, { onSuccess: () => setConfirmando(false) })
                  }
                >
                  {messages.children.deactivateSubmit}
                </Button>
              </>
            }
          >
            {deactivate.error !== null && (
              <Alert tone={alertToneFor(deactivate.error)}>
                {describeChildrenError(deactivate.error)}
              </Alert>
            )}
          </Dialog>
        </div>
      </Card>
    </li>
  );
}
