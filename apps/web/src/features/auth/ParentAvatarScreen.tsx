import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../../api/auth.js";
import { messages } from "../../lib/messages.js";
import { ImageUploadField } from "../uploads/ImageUploadField.js";
import { Avatar } from "./Avatar.js";
import { useSession } from "./use-session.js";

/**
 * El padre cambia su propia foto.
 *
 * No existía ninguna pantalla para esto: hasta ahora el padre elegía su avatar
 * al registrarse y no volvía a verlo, porque su actor tampoco lo llevaba.
 *
 * Solo ofrece subir una foto, no elegir del catálogo: no hay ninguna interfaz
 * hoy donde el padre escoja ilustración, y el contrato de la API tampoco lo
 * admite todavía.
 */
export function ParentAvatarScreen({ onDone }: { onDone: () => void }): React.ReactElement {
  const { session } = useSession();
  const queryClient = useQueryClient();

  const actualizar = useMutation({
    mutationFn: api.updateParentAvatar,
    onSuccess: async () => {
      // Su avatar viaja en el actor y en la rejilla: las dos hay que refrescar.
      await queryClient.invalidateQueries({ queryKey: api.sessionQueryKey });
      await queryClient.invalidateQueries({ queryKey: api.profilesQueryKey });
    },
  });

  const avatar = session?.actor?.avatar;

  return (
    <section style={{ maxWidth: "24rem" }}>
      <h2>{messages.auth.myAvatarTitle}</h2>

      <p>
        <Avatar value={avatar} size={96} alt={messages.auth.myAvatarTitle} />
      </p>

      <ImageUploadField
        requestUploadUrl={api.requestParentAvatarUploadUrl}
        onUploaded={(key) => actualizar.mutate(key)}
        aspect={1}
        label={messages.uploads.choose}
      />

      {actualizar.isSuccess && <p>{messages.children.avatarSaved}</p>}

      {actualizar.error !== null && (
        <p role="alert" style={{ color: "#b00020" }}>
          {messages.uploads.failed}
        </p>
      )}

      <button type="button" onClick={onDone} style={{ marginTop: "1rem" }}>
        {messages.auth.back}
      </button>
    </section>
  );
}
