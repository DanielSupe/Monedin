import type { AvatarKey, ImageContentType, UploadUrl } from "@monedin/contracts";
import { messages } from "../../lib/messages.js";
import { Avatar } from "../auth/Avatar.js";
import { AVATAR_OPTIONS } from "../auth/avatars.js";
import { ImageUploadField } from "../uploads/ImageUploadField.js";

/**
 * Selector del avatar de un perfil: el catálogo de animales, y opcionalmente
 * subir una foto propia.
 *
 * Las dos formas CONVIVEN. Elegir un animal es inmediato y no necesita cámara
 * ni conexión, y sigue siendo una respuesta completa a «¿quién eres?»; la foto
 * es la otra forma del mismo campo, no su sustituto.
 *
 * Quien usa el componente decide qué hacer con cada una: `onChange` manda una
 * clave del catálogo, `onUpload` una foto ya subida. Son excluyentes en el
 * contrato, así que se mandan por separado y nunca juntas.
 */
export function AvatarPicker({
  value,
  onChange,
  label,
  requestUploadUrl,
  onUpload,
}: {
  value: string | undefined;
  onChange: (avatar: AvatarKey) => void;
  label: string;
  /** Con las dos, el selector ofrece además subir una foto. */
  requestUploadUrl?: (contentType: ImageContentType) => Promise<UploadUrl>;
  onUpload?: (key: string) => void;
}): React.ReactElement {
  const puedeSubir = requestUploadUrl !== undefined && onUpload !== undefined;

  return (
    <fieldset style={{ border: "1px solid #ccc", padding: "0.75rem" }}>
      <legend>{label}</legend>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {AVATAR_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            aria-pressed={value === option.key}
            aria-label={option.key}
            style={{
              fontSize: "1.75rem",
              padding: "0.35rem 0.5rem",
              lineHeight: 1,
              border: value === option.key ? "2px solid #0b6" : "1px solid #ccc",
              background: "none",
              cursor: "pointer",
            }}
          >
            {option.glyph}
          </button>
        ))}
      </div>

      {puedeSubir && (
        <div style={{ marginTop: "0.75rem", borderTop: "1px solid #eee", paddingTop: "0.75rem" }}>
          <ImageUploadField
            requestUploadUrl={requestUploadUrl}
            onUploaded={onUpload}
            aspect={1}
            label={messages.uploads.choose}
          />

          {/* La foto actual, para que se vea qué hay puesto ahora mismo. */}
          {value !== undefined && value.startsWith("http") && (
            <p>
              <Avatar value={value} size={64} alt={label} />
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
