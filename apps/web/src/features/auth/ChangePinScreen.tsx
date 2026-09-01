import { changeAdultPinSchema } from "@monedin/contracts";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { Alert, Button, Card, Field, Input } from "../../ui/index.js";
import { describeAuthError, useChangeAdultPin } from "./use-session.js";

/**
 * Cambia el PIN de adulto indicando el actual.
 *
 * A diferencia de `ResetPinScreen`, exige perfil de padre activo: es la ruta
 * normal, no la de rescate. La monta `requireParent` en el servidor.
 *
 * Desde `redesign-parent-home` es una PARTE de `/account`. Por eso al terminar
 * no sustituye la pantalla entera por un «listo» con un enlace de vuelta: eso
 * se llevaba por delante la otra mitad de la cuenta. El éxito es un aviso, y el
 * formulario se queda donde está.
 */
export function ChangePinScreen(): React.ReactElement {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const change = useChangeAdultPin();

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    setFieldError(undefined);

    const parsed = changeAdultPinSchema.safeParse({ currentPin, newPin });
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
      <div className="flex flex-col gap-4">
        <h3 className="text-body font-bold">{messages.auth.changePinTitle}</h3>

        <form onSubmit={submit} className="flex max-w-sm flex-col gap-4">
          {/*
            `type="text"` y no `password`, igual que en las otras dos pantallas
            de PIN del proyecto. Enmascararlo aquí solo dejaría a esta distinta
            de sus hermanas; si hay que hacerlo, es en las tres a la vez.
          */}
          <Field label={messages.auth.currentPin}>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={currentPin}
              onChange={(evento) => setCurrentPin(evento.target.value)}
            />
          </Field>

          <Field label={messages.auth.newPin}>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              onChange={(evento) => setNewPin(evento.target.value)}
            />
          </Field>

          <Button type="submit" variant="primary" pending={change.isPending}>
            {change.isPending ? messages.auth.working : messages.auth.changePinSubmit}
          </Button>
        </form>

        {change.isSuccess && error === undefined && (
          <Alert tone="success">{messages.auth.pinChanged}</Alert>
        )}

        {error !== undefined && <Alert tone="danger">{error}</Alert>}
      </div>
    </Card>
  );
}
