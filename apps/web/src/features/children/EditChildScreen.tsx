import { Link } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
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
 */
export function EditChildScreen({
  childId,
  onSettled,
}: {
  childId: string;
  /** El perfil quedó guardado, o quien lo editaba se echó atrás. */
  onSettled: () => void;
}): React.ReactElement {
  const { data: child, isPending, error } = useChild(childId);

  if (isPending) {
    return <p>{messages.health.loading}</p>;
  }

  if (error !== null || child === undefined) {
    return (
      <section>
        <p role="alert" style={{ color: "#b00020" }}>
          {error === null ? messages.children.notFound : describeChildrenError(error)}
        </p>
        <Link to="/children" search={{ page: 1 }}>
          {messages.children.back}
        </Link>
      </section>
    );
  }

  return <ChildForm child={child} onSaved={onSettled} onCancel={onSettled} />;
}
