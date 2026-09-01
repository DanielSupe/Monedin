import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../../api/auth.js";
import { messages } from "../../lib/messages.js";
import { Alert, Avatar, Card } from "../../ui/index.js";
import { ImageUploadField } from "../uploads/ImageUploadField.js";
import { useSession } from "./use-session.js";

/**
 * El padre cambia su propia foto.
 *
 * No existía ninguna pantalla para esto: hasta `add-file-storage` el padre
 * elegía su avatar al registrarse y no volvía a verlo, porque su actor tampoco
 * lo llevaba.
 *
 * Solo ofrece subir una foto, no elegir del catálogo: no hay ninguna interfaz
 * hoy donde el padre escoja ilustración, y el contrato de la API tampoco lo
 * admite todavía.
 *
 * Desde `redesign-parent-home` es una PARTE de `/account` y no una pantalla
 * suelta: sin título de nivel superior, sin enlace de vuelta propio —el logo
 * del marco es la salida, igual que en todas las demás— y con el error en
 * `Alert`, que era el `<p style={{ color: "#b00020" }}>` que la tenía en la
 * lista de deuda.
 */
export function ParentAvatarScreen(): React.ReactElement {
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
    <Card>
      <div className="flex flex-col gap-4">
        <h3 className="text-body font-bold">{messages.auth.myAvatarTitle}</h3>

        <div className="flex flex-wrap items-center gap-4">
          <Avatar value={avatar} size="large" alt={messages.auth.myAvatarTitle} />

          <div className="min-w-0 flex-1">
            <ImageUploadField
              requestUploadUrl={api.requestParentAvatarUploadUrl}
              onUploaded={(key) => actualizar.mutate(key)}
              aspect={1}
              label={messages.uploads.choose}
            />
          </div>
        </div>

        {actualizar.isSuccess && <Alert tone="success">{messages.children.avatarSaved}</Alert>}

        {actualizar.error !== null && <Alert tone="danger">{messages.uploads.failed}</Alert>}
      </div>
    </Card>
  );
}
