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
  const [confirmando, setConfirmando] = useState(false);
  const [reponiendoPin, setReponiendoPin] = useState(false);
  const [pinNuevo, setPinNuevo] = useState("");

  const deactivate = useDeactivateChild();
  const setPin = useSetChildPin();
  const unlock = useUnlockChildProfile();

  function reponer(evento: React.FormEvent): void {
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

              {child.age !== null && (
                <p className="text-small text-ink-muted">
                  {contar(child.age, messages.children.yearsOne, messages.children.yearsMany)}
                </p>
              )}
            </div>

            <Coins amount={child.coins} />

            {child.locked && <Badge tone="conflict">{messages.children.locked}</Badge>}
          </div>

          <div className="flex flex-wrap gap-2">

            <Link
              to="/children/$childId/edit"
              params={{ childId: child.id }}
              aria-label={`${messages.children.editFull} ${child.name}`}
              className={buttonClasses("secondary")}
            >
              {messages.children.edit}
            </Link>

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
