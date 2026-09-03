import { messages } from "../../lib/messages.js";
import { Avatar, Card, Skeleton } from "../../ui/index.js";
import { useSession } from "./use-session.js";

/**
 * De quién es la cuenta.
 *
 * Faltaba lo primero que una cuenta tiene que decir. El niño tiene su tarjeta de
 * identidad en «Mi perfil» —su avatar, su nombre y su saldo— y el padre no tenía
 * la suya, así que llegaba a una pantalla donde se cambia una credencial sin
 * nada que le confirmase en qué cuenta estaba. En una tablet compartida eso
 * importa más que en un dispositivo personal.
 *
 * El dato sale del ACTOR y no de una petición nueva: `parentActorSchema` ya
 * lleva nombre, correo y avatar desde `add-file-storage`, que es cuando el
 * avatar del padre dejó de ser «el mismo dato en dos sitios comportándose
 * distinto». Un `GET /auth/me` sería ese segundo camino otra vez, con su propia
 * caché que puede separarse. Ver la decisión 2 del design de
 * `polish-profile-and-reward-image`.
 *
 * El correo se enseña ENTERO. Enmascararlo protegería de quien mira por encima
 * del hombro, pero lo que esta pantalla responde es «¿en qué cuenta estoy?», y
 * un correo con asteriscos no lo responde. Además solo se llega aquí tras
 * teclear el PIN de adulto.
 */
export function ParentIdentity(): React.ReactElement {
  const { session } = useSession();
  const actor = session?.actor;

  // La ruta está detrás de `requireParent`, así que esto es el primer pintado y
  // no un caso que pueda quedarse. Se estrecha el tipo, además, para llegar al
  // correo: solo el actor de padre lo lleva.
  if (actor === undefined || actor === null || actor.familyRole !== "PARENT") {
    return <Skeleton lines={2} />;
  }

  return (
    <Card>
      <div className="flex items-center gap-4">
        <Avatar value={actor.avatar} size="large" alt={actor.name} />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-title font-bold">{actor.name}</p>
          <p className="text-small text-ink-muted truncate">
            <span className="sr-only">{messages.auth.accountEmailLabel}</span>
            {actor.email}
          </p>
        </div>
      </div>
    </Card>
  );
}
