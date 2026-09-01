import type { AvatarKey, ImageContentType, UploadUrl } from "@monedin/contracts";
import { messages } from "../../lib/messages.js";
import { Avatar } from "../../ui/Avatar.js";
import { Card, cx } from "../../ui/index.js";
import { AVATAR_OPTIONS } from "../../ui/avatars.js";
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
    /*
      `min-w-0` en el `fieldset` a propósito: un fieldset toma como ancho mínimo
      el de su contenido, así que sin esto arrastraba a la pantalla entera. Era
      la mitad del desbordamiento de «Mi perfil»; la otra mitad era el control
      de archivo, y esa la arregló `ImageUploadField`.
    */
    <Card>
      <fieldset className="flex min-w-0 flex-col gap-3">
        <legend className="text-small font-semibold">{label}</legend>

        <div className="flex flex-wrap gap-2">
          {AVATAR_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange(option.key)}
              aria-pressed={value === option.key}
              aria-label={option.key}
              className={cx(
                "rounded-control text-title tap-target flex items-center justify-center border bg-surface-raised px-2 leading-none transition-colors duration-quick",
                // El elegido se marca con el color de acción y un borde más
                // grueso: `aria-pressed` lo dice a quien no ve la pantalla, y
                // esto a quien sí.
                value === option.key
                  ? "border-2 border-primary bg-primary-soft"
                  : "border-border-strong hover:bg-surface-sunken",
              )}
            >
              {option.glyph}
            </button>
          ))}
        </div>

        {puedeSubir && (
          <div className="flex min-w-0 flex-col gap-3 border-t border-border pt-3">
            <ImageUploadField
              requestUploadUrl={requestUploadUrl}
              onUploaded={onUpload}
              aspect={1}
              label={messages.uploads.choose}
            />

            {/* La foto actual, para que se vea qué hay puesto ahora mismo. */}
            {value !== undefined && value.startsWith("http") && (
              <Avatar value={value} size="large" alt={label} className="self-start" />
            )}
          </div>
        )}
      </fieldset>
    </Card>
  );
}
