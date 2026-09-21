import { PIN_LENGTH, type Child } from "@monedin/contracts";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { alertToneFor } from "../../lib/alert-tone.js";
import { PIN_LABEL, messages } from "../../lib/messages.js";
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
import { contar } from "../../lib/plural.js";
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
        <div className="flex flex-col gap-1">
          <span className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
            {messages.children.listLead}
          </span>
          <h2 className="text-display font-extrabold">{messages.children.title}</h2>
        </div>
        <Link to="/children/new" className={buttonClasses("primary")}>
          {messages.children.addChild}
        </Link>
      </div>

      {/*
        DOS PALABRAS PARECIDAS Y UNA SOLA IRREVERSIBLE, dicho en la pantalla.

        Esta fila ofrece «Dar de baja» y, cuando toca, «Desbloquear». Suenan a lo
        mismo y no lo son: una se deshace pulsándola otra vez y la otra se lleva
        el saldo y el historial de un niño para siempre. Y bloquear no lo decide
        nadie, pasa por fallar el PIN.

        Va aquí y no dentro del diálogo de confirmación: allí llega quien YA
        pulsó, y lo que hace falta es que no confunda las dos ANTES. Es la misma
        razón por la que la bandeja de tareas explica su filtro en la pantalla —
        una decisión de producto que no se explica es indistinguible de un
        defecto.
      */}
      <Alert tone="info">{messages.children.deactivateVsLock}</Alert>

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
              <p className="truncate text-lead font-extrabold">{child.name}</p>
              {/*
                «10 años» y no «Edad: 10», que es lo que decía y lo que dibuja su
                maqueta. El mismo dato se escribía de DOS maneras en el producto:
                aquí con su etiqueta delante y en el perfil del propio niño con
                `contar`, que es la forma que ya evita «1 años».

                Y la etiqueta suelta sobraba: nadie necesita que le digan que un
                número seguido de «años» es una edad.
              */}
              {child.age !== null && (
                <p className="text-small text-ink-muted">
                  {contar(child.age, messages.children.yearsOne, messages.children.yearsMany)}
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
            {child.locked && <Badge tone="conflict">{messages.children.locked}</Badge>}
          </div>

          <div className="flex flex-wrap gap-2">
            {/*
              ETIQUETAS CORTAS Y NOMBRE COMPLETO ANUNCIADO.

              La fila de un perfil bloqueado lleva cinco controles y es la que se
              sale; con las etiquetas enteras no caben. Y cortarlas crearía el
              otro problema —cuatro «Editar» seguidos suenan idénticos a quien no
              ve la pantalla—, así que cada una se anuncia con el nombre de su
              hijo. Es el mismo criterio que las dos bandejas del padre.
            */}
            <Link
              to="/children/$childId/edit"
              params={{ childId: child.id }}
              aria-label={`${messages.children.editFull} ${child.name}`}
              className={buttonClasses("secondary")}
            >
              {messages.children.edit}
            </Link>

            {/* La respuesta a «este saldo no me cuadra», que hasta
                `add-coin-history` no tenía dónde mirarse. */}
            <Link
              to="/children/$childId/coins"
              params={{ childId: child.id }}
              search={{ page: 1 }}
              aria-label={`${messages.children.historyFull} ${child.name}`}
              className={buttonClasses("secondary")}
            >
              {messages.children.historyShort}
            </Link>

            <Button
              type="button"
              variant="secondary"
              aria-label={`${messages.children.resetPinFull} ${child.name}`}
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
                aria-label={`${messages.children.unlockFull} ${child.name}`}
                pending={unlock.isPending}
                onClick={() => unlock.mutate(child.id)}
              >
                {messages.children.unlock}
              </Button>
            )}

            <Button
              type="button"
              variant="danger"
              aria-label={`${messages.children.deactivateFull} ${child.name}`}
              onClick={() => setConfirmando(true)}
            >
              {messages.children.deactivate}
            </Button>
          </div>

          {unlock.error !== null && (
            <Alert tone={alertToneFor(unlock.error)}>{describeChildrenError(unlock.error)}</Alert>
          )}

          {reponiendoPin && (
            <form onSubmit={reponer} className="flex flex-col gap-3 border-t border-border pt-3">
              <Field label={PIN_LABEL} help={messages.children.pinHelp}>
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
            {/*
              LA SALIDA, para el caso que de verdad trae a un padre hasta aquí.

              Un perfil bloqueado es un niño que falló el PIN, y la fila enseña
              «Dar de baja» a un dedo de distancia. Avisar de que no se deshace no
              ataja ese error por sí solo: hay que decir cuál es la otra cosa y
              ofrecerla aquí mismo, sin obligar a cerrar y buscarla.
            */}
            {child.locked && (
              <Alert tone="conflict">
                {messages.children.deactivateLockedHint}
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    pending={unlock.isPending}
                    onClick={() =>
                      unlock.mutate(child.id, { onSuccess: () => setConfirmando(false) })
                    }
                  >
                    {messages.children.unlock}
                  </Button>
                </div>
              </Alert>
            )}

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
