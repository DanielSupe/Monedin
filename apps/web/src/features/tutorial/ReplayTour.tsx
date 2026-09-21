import { useNavigate } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { Alert, Button, Card, Mascota } from "../../ui/index.js";
import { useUpdateTutorial } from "../auth/use-session.js";

/**
 * Volver a ver el recorrido de bienvenida, desde los ajustes del perfil.
 *
 * Existe porque el recorrido se puede saltar: sin esto, quien lo saltó por
 * prisa pierde la explicación para siempre — y es quien más la necesitará
 * después.
 *
 * Pide `{ seen: false }` y LLEVA AL INICIO, que es donde el recorrido vive.
 * Dejarlo en los ajustes obligaba a navegar a mano después de pedirlo, y quien
 * pulsa «verlo otra vez» está pidiendo verlo ahora, no la próxima vez que pase
 * por el panel.
 *
 * Se espera a la mutación y DESPUÉS se navega, sin pasar por un `onSuccess`.
 * No es rodeo: un callback sin argumentos es exactamente lo que el test de
 * navegación prohíbe —`onSaved` es el único permitido— y da igual que aquí sea
 * la opción de una mutación y no una prop; lo que la regla persigue es cablear
 * la navegación por una función, y eso es lo que era.
 *
 * Navegar aquí sí funciona, y conviene decir por qué no contradice la otra
 * regla: la que prohíbe navegar tras una mutación habla de cuando cambia el
 * ACTOR —entrar, salir, cerrar sesión—, porque entonces la raíz cambia de marco
 * y desmonta a quien llamó. Esto solo cambia un campo del mismo actor: el marco
 * es el mismo y el componente sigue montado.
 *
 * Afecta SOLO al perfil que lo pide: a quién se le explicó sale del actor.
 */
export function ReplayTour(): React.ReactElement {
  const marcar = useUpdateTutorial();
  const navigate = useNavigate();

  const pedirlo = async (): Promise<void> => {
    await marcar.mutateAsync({ seen: false });
    await navigate({ to: "/" });
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/*
          QUÉ ES EL RECORRIDO, que no lo decía.

          «Ver el recorrido otra vez» solo tiene sentido para quien lo vio; a
          quien lo saltó —que es justo quien más ganaría volviendo— no le dice
          qué se está ofreciendo. La maqueta pone la línea, y la mascota al lado,
          porque es ella la que lo cuenta.
        */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Mascota pose="presenta" size="small" className="shrink-0" />

          <div className="flex min-w-0 flex-col">
            <p className="text-body font-bold">{messages.tutorial.replay}</p>
            <p className="text-small text-ink-muted">{messages.tutorial.replayLead}</p>
          </div>
        </div>

        <Button
          variant="secondary"
          pending={marcar.isPending}
          // El rechazo se traga a propósito: la mutación ya lo guarda y el aviso
          // de abajo lo enseña. Sin el `catch`, sería un rechazo sin atender.
          onClick={() => void pedirlo().catch(() => undefined)}
        >
          {messages.tutorial.replayAction}
        </Button>
      </div>

      {marcar.error !== null && (
        <Alert tone="danger">{messages.tutorial.replayFailed}</Alert>
      )}
    </Card>
  );
}
