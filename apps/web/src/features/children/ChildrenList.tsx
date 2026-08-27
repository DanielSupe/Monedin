import { PIN_LENGTH, type Child } from "@monedin/contracts";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { Avatar } from "../../ui/Avatar.js";
import { useSetChildPin, useUnlockChildProfile } from "../auth/use-session.js";
import { describeChildrenError, useChildren, useDeactivateChild } from "./use-children.js";

/**
 * Gestión de los perfiles desde el lado del padre.
 *
 * Reponer el PIN y desbloquear NO son endpoints de este módulo: son los de
 * `auth` que ya existían. Cambiar una credencial y revocar sesiones es suyo.
 */
export function ChildrenList({ page }: { page: number }): React.ReactElement {
  const { data, isPending, error } = useChildren(page);

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
            <ChildRow key={child.id} child={child} />
          ))}
        </ul>
      )}

      {data !== undefined && data.totalPages > 1 && (
        <nav style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", alignItems: "center" }}>
          {page > 1 && (
            <Link to="/children" search={{ page: page - 1 }}>
              {messages.children.previousPage}
            </Link>
          )}
          <span>
            {data.page} / {data.totalPages}
          </span>
          {page < data.totalPages && (
            <Link to="/children" search={{ page: page + 1 }}>
              {messages.children.nextPage}
            </Link>
          )}
        </nav>
      )}

      <p style={{ marginTop: "1rem" }}>
        <Link to="/children/new">{messages.children.addChild}</Link>
      </p>
    </section>
  );
}

function ChildRow({ child }: { child: Child }): React.ReactElement {
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
        <Link to="/children/$childId/edit" params={{ childId: child.id }}>
          {messages.children.edit}
        </Link>

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
