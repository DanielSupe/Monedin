import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../../api/auth.js";
import { messages } from "../../lib/messages.js";
import { Alert } from "../../ui/index.js";
import { AvatarPicker } from "../profiles/AvatarPicker.js";
import { useSession } from "./use-session.js";

export function ParentAvatarScreen(): React.ReactElement {
  const { session } = useSession();
  const queryClient = useQueryClient();

  const actualizar = useMutation({
    mutationFn: api.updateParentAvatar,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: api.sessionQueryKey });
      await queryClient.invalidateQueries({ queryKey: api.profilesQueryKey });
    },
  });

  const avatar = session?.actor?.avatar;

  return (
    <div className="flex flex-col gap-4">

      <AvatarPicker
        value={avatar}
        label={messages.auth.myAvatarTitle}
        onChange={(clave) => actualizar.mutate({ avatar: clave })}
        requestUploadUrl={api.requestParentAvatarUploadUrl}
        onUpload={(avatarUploadKey) => actualizar.mutate({ avatarUploadKey })}
      />

      {actualizar.isSuccess && <Alert tone="done">{messages.children.avatarSaved}</Alert>}

      {actualizar.error !== null && <Alert tone="danger">{messages.uploads.failed}</Alert>}
    </div>
  );
}
