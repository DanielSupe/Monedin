import { AVATAR_MAX_DIMENSION, type AvatarKey, type ImageContentType, type UploadUrl } from "@monedin/contracts";
import { messages } from "../../lib/messages.js";
import { Avatar, Card, cx } from "../../ui/index.js";
import { AVATAR_OPTIONS } from "../../ui/avatars.js";
import { ImageUploadField } from "../uploads/ImageUploadField.js";

/**
 * Selector del avatar de un perfil: el catálogo de animales, y opcionalmente
 * subir una foto propia.
 *
 * Vive en `features/profiles/` y no en `features/children/` desde que la cuenta
 * del padre lo usa también. No sabe qué es un hijo —recibe un valor y dos
 * devoluciones—, así que tenerlo bajo `children/` era una etiqueta falsa en
 * cuanto lo montó alguien que no lo es.
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
  note,
  requestUploadUrl,
  onUpload,
}: {
  value: string | undefined;
  onChange: (avatar: AvatarKey) => void;
  label: string;
  /**
   * Qué pasa con lo que este selector NO ofrece.
   *
   * Existe para el alta, donde no se puede subir una foto —la clave de subida
   * cuelga del identificador del hijo, que todavía no existe—. Un hueco sin
   * explicar se lee como un defecto del producto, y decir solo «aquí no» deja a
   * quien lo lee sin saber qué hacer.
   */
  note?: string;
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
                "rounded-control tap-target flex items-center justify-center border bg-surface-raised p-1.5 transition-colors duration-quick",
                // El elegido se marca con el color de acción y un borde más
                // grueso: `aria-pressed` lo dice a quien no ve la pantalla, y
                // esto a quien sí.
                value === option.key
                  ? "border-2 border-primary bg-primary-soft"
                  : "border-border-strong hover:bg-surface-sunken",
              )}
            >
              {/*
                LA MISMA PIEZA QUE DIBUJA UN AVATAR EN TODO EL PRODUCTO, y antes
                era el fragmento crudo de `AVATAR_OPTIONS.drawing`.

                Ese fragmento son los `<path>` sueltos, SIN su `<svg>` alrededor
                —quien lo envuelve es `avatarDrawing`—, así que el navegador no
                pintaba nada: la rejilla salía con doce cajas vacías. Se veía
                abriendo la pantalla y ningún test lo decía, porque jsdom no
                pinta y los doce botones seguían teniendo su nombre.

                Se arregla usando `Avatar`, no envolviendo aquí: hay UNA forma de
                dibujar un avatar en este proyecto y esta pantalla no tenía por
                qué conocer otra.
              */}
              <Avatar value={option.key} size="small" />
            </button>
          ))}
        </div>

        {note !== undefined && !puedeSubir && (
          <p className="text-small text-ink-muted">{note}</p>
        )}

        {puedeSubir && (
          <div className="flex min-w-0 flex-col gap-3 border-t border-border pt-3">
            {/*
              LA ALTERNATIVA SE NOMBRA, y antes solo había un botón de archivo.

              Encima hay una rejilla de animales y debajo un «elegir una foto»,
              separados por una línea: sin una frase en medio, la segunda parece
              otro paso del primero en vez de la otra opción. La maqueta lo dice
              con un «o» delante, que es exactamente la relación entre las dos.
            */}
            <p className="text-small font-semibold">{messages.uploads.orYourOwnPhoto}</p>

            {/*
              Sin repetir la foto actual debajo: las dos pantallas que montan
              esto tienen ya su tarjeta de identidad encima, con el avatar
              puesto. Enseñarlo otra vez aquí lo sacaba dos veces.
            */}
            <ImageUploadField
              requestUploadUrl={requestUploadUrl}
              onUploaded={onUpload}
              aspect={1}
              // Recorta Y guarda pequeño: un avatar se pinta en 24 o 36 px.
              maxDimension={AVATAR_MAX_DIMENSION}
              label={messages.uploads.choose}
            />
          </div>
        )}
      </fieldset>
    </Card>
  );
}
