import { Link, useNavigate } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { ChildForm } from "./ChildForm.js";

/**
 * Alta de un perfil desde la rejilla, SIN haber elegido perfil.
 *
 * Es la única pantalla de gestión que se usa sin actor: `POST /children` se
 * conforma con la cuenta acreditada, porque crear un perfil es uno de los pasos
 * previos a ser alguien, igual que listarlos o entrar a uno. Sin esto, una
 * familia recién registrada llegaría a una rejilla con un solo perfil y ninguna
 * salida.
 *
 * Que no pida el PIN de adulto NO significa que valga cualquiera: si el perfil
 * activo es el de un niño, la API responde 403 y aquí se ve el mensaje.
 *
 * Al vestirla hay que recordar que su marco es `EntryShell` y no el del padre:
 * es la única de las cuatro que vive en los dos lados, así que no puede asumir
 * ancho ni escala. `ChildForm` ya declara el suyo.
 */
export function CreateProfileScreen(): React.ReactElement {
  const navigate = useNavigate();
  const volver = (): void => void navigate({ to: "/profiles" });

  return (
    <ChildForm
      onSaved={volver}
      cancel={
        <Link to="/profiles" className="text-small">
          {messages.children.cancel}
        </Link>
      }
    />
  );
}
