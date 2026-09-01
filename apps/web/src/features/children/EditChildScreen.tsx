import { Link } from "@tanstack/react-router";
import { alertToneFor } from "../../lib/alert-tone.js";
import { messages } from "../../lib/messages.js";
import { Alert, Skeleton, buttonClasses } from "../../ui/index.js";
import { ChildForm } from "./ChildForm.js";
import { describeChildrenError, useChild } from "./use-children.js";

/**
 * Editar un hijo cuando lo único que se tiene es su identificador.
 *
 * Existe porque una dirección no puede llevar la entidad dentro, y antes el
 * listado se la pasaba entera. El coste es una petición al abrirla en frío; a
 * cambio, la dirección se recarga y se comparte. Ver decisión 5 del design de
 * `add-app-shell`.
 *
 * Un identificador ajeno o inexistente responde 404 —nunca 403, para no
 * confirmar que existe—, y aquí eso se traduce en la salida de vuelta al
 * listado en lugar de una pantalla en blanco.
 *
 * Un hijo se edita AQUÍ, en su propia ruta, y un premio en línea dentro de su
 * tarjeta. No es una incoherencia: son dos gestos de tamaño distinto. Editar un
 * premio es subir un precio o cambiar una foto; editar un hijo es nombre, edad y
 * avatar, y no cabe en una fila. Ver la decisión 3 del design de
 * `redesign-parent-children`, que cerró esa pregunta.
 */
export function EditChildScreen({
  childId,
  onSaved,
}: {
  childId: string;
  /**
   * El perfil quedó guardado. Evento de dominio.
   *
   * Era `onSettled` —«guardó, o se echó atrás»—, que mezclaba un hecho con una
   * orden de cerrarse y por eso obligaba a quien llamaba a navegar por las dos
   * razones. Salir sin guardar es ahora un enlace, aquí abajo.
   */
  onSaved: () => void;
}): React.ReactElement {
  const { data: child, isPending, error } = useChild(childId);

  if (isPending) {
    return <Skeleton lines={5} />;
  }

  if (error !== null || child === undefined) {
    return (
      <section className="flex flex-col gap-4">
        <Alert tone={error === null ? "danger" : alertToneFor(error)}>
          {error === null ? messages.children.notFound : describeChildrenError(error)}
        </Alert>

        <Link
          to="/children"
          search={{ page: 1 }}
          className={`${buttonClasses("secondary")} self-start`}
        >
          {messages.children.back}
        </Link>
      </section>
    );
  }

  return (
    <ChildForm
      child={child}
      onSaved={onSaved}
      cancel={
        <Link to="/children" search={{ page: 1 }} className="text-small">
          {messages.children.cancel}
        </Link>
      }
    />
  );
}
