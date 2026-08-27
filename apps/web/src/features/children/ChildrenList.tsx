import { PIN_LENGTH, type Child } from "@monedin/contracts";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { Avatar } from "../../ui/Avatar.js";
import { useSetChildPin, useUnlockChildProfile } from "../auth/use-session.js";
import { ChildForm } from "./ChildForm.js";
import { describeChildrenError, useChildren, useDeactivateChild } from "./use-children.js";

/**
 * Gestión de los perfiles desde el lado del padre.
 *
 * Reponer el PIN y desbloquear NO son endpoints de este módulo: son los de
 * `auth` que ya existían. Cambiar una credencial y revocar sesiones es suyo.
 */
type View = { name: "list" } | { name: "new" } | { name: "edit"; child: Child };

export function ChildrenList(): React.ReactElement {
  const [view, setView] = useState<View>({ name: "list" });
  const [page, setPage] = useState(1);
  const { data, isPending, error } = useChildren(page);

  if (view.name === "new") {
    return <ChildForm onDone={() => setView({ name: "list" })} onCancel={() => setView({ name: "list" })} />;
  }

  if (view.name === "edit") {
    return (
      <ChildForm
        child={view.child}
        onDone={() => setView({ name: "list" })}
        onCancel={() => setView({ name: "list" })}
      />
    );
  }

  if (isPending) {
    return <p>{messages.health.loading}</p>;
  }

  if (error) {
    return (
      <p role="alert" style={{ color: "#b00020" }}>
        {describeChildrenError(error)}
      </p>
    );
  }

  const hijos = data?.items ?? [];

  return (
    <section>
      <h2>{messages.children.title}</h2>

      {hijos.length === 0 ? (
        <p>{messages.children.empty}</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.75rem" }}>
          {hijos.map((child) => (
            <ChildRow key={child.id} child={child} onEdit={() => setView({ name: "edit", child })} />
          ))}
        </ul>
      )}

      {data !== undefined && data.totalPages > 1 && (
        <nav style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", alignItems: "center" }}>
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {messages.children.previousPage}
          </button>
          <span>
            {data.page} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.totalPages}
            onClick={() => setPage(page + 1)}
          >
            {messages.children.nextPage}
          </button>
        </nav>
      )}

      <button type="button" onClick={() => setView({ name: "new" })} style={{ marginTop: "1rem" }}>
        {messages.children.addChild}
      </button>
    </section>
  );
}

function ChildRow({ child, onEdit }: { child: Child; onEdit: () => void }): React.ReactElement {
  const [confirming, setConfirming] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [changingPin, setChangingPin] = useState(false);

  const deactivate = useDeactivateChild();
  const setPin = useSetChildPin();
  const unlock = useUnlockChildProfile();

  return (
    <li style={{ border: "1px solid #ccc", padding: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Avatar value={child.avatar} size="small" />
        <span style={{ flex: 1 }}>
          <strong>{child.name}</strong>
          {child.age !== null && <span> · {child.age}</span>}
          <span>
            {" · "}
            {child.coins} {messages.children.coins.toLowerCase()}
          </span>
          {child.locked && <span style={{ color: "#b00020" }}> · {messages.children.locked}</span>}
        </span>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" onClick={onEdit}>
          {messages.children.edit}
        </button>

        <button type="button" onClick={() => setChangingPin(!changingPin)}>
          {messages.children.resetPin}
        </button>

        {child.locked && (
          <button type="button" onClick={() => unlock.mutate(child.id)} disabled={unlock.isPending}>
            {messages.children.unlock}
          </button>
        )}

        <button type="button" onClick={() => setConfirming(true)}>
          {messages.children.deactivate}
        </button>
      </div>

      {changingPin && (
        <div style={{ marginTop: "0.5rem" }}>
          <label>
            {messages.children.pin}
            <input
              type="text"
              inputMode="numeric"
              maxLength={PIN_LENGTH}
              value={newPin}
              onChange={(event) => setNewPin(event.target.value)}
              style={{ display: "block" }}
            />
          </label>
          <button
            type="button"
            disabled={setPin.isPending}
            onClick={() =>
              setPin.mutate(
                { childProfileId: child.id, pin: newPin },
                {
                  onSuccess: () => {
                    setNewPin("");
                    setChangingPin(false);
                  },
                },
              )
            }
          >
            {messages.children.save}
          </button>
          {setPin.error !== null && (
            <p role="alert" style={{ color: "#b00020" }}>
              {describeChildrenError(setPin.error)}
            </p>
          )}
        </div>
      )}

      {confirming && (
        <div style={{ marginTop: "0.5rem" }}>
          {/* La baja no se puede deshacer, así que se dice ANTES y no después. */}
          <p role="alert">{messages.children.deactivateConfirm}</p>
          <button
            type="button"
            disabled={deactivate.isPending}
            onClick={() => deactivate.mutate(child.id, { onSuccess: () => setConfirming(false) })}
          >
            {messages.children.deactivateSubmit}
          </button>
          <button type="button" onClick={() => setConfirming(false)}>
            {messages.children.cancel}
          </button>
          {deactivate.error !== null && (
            <p role="alert" style={{ color: "#b00020" }}>
              {describeChildrenError(deactivate.error)}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
