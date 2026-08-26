import type { ImageContentType, UploadUrl } from "@monedin/contracts";
import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { putToUploadUrl, UploadError } from "../../lib/s3-upload.js";
import { messages } from "../../lib/messages.js";
import { cropToBlob, isAllowedImage, prepareImage } from "./prepare-image.js";

/**
 * Elegir una foto, prepararla y subirla.
 *
 * UNA sola pieza para los tres casos —avatar, premio, evidencia—, no tres
 * copias. Lo que cambia entre ellos es una prop:
 *
 *   - Con `aspect`, monta el recortador. Es para los avatares, que se pintan
 *     pequeños y en rejilla, donde el encuadre importa.
 *   - Sin `aspect`, solo comprime. Es para la foto de un premio o la evidencia
 *     de una tarea, donde recortar a cuadrado quitaría justo lo que hay que ver:
 *     el juguete entero, la cama hecha.
 *
 * NO sabe de hijos, premios ni tareas: recibe cómo pedir la URL y qué hacer con
 * la clave confirmada. Ver la decisión 10 del design de `add-file-storage`.
 */
interface ImageUploadFieldProps {
  /** Cómo pedir la URL de subida. Lo sabe quien usa el componente, no él. */
  requestUploadUrl: (contentType: ImageContentType) => Promise<UploadUrl>;
  /** Qué hacer con la clave, una vez el archivo está arriba de verdad. */
  onUploaded: (key: string) => void;
  /** Con valor, recorta a esa proporción. Sin él, solo comprime. */
  aspect?: number;
  label?: string;
}

type Estado =
  | { name: "idle" }
  | { name: "cropping"; src: string; contentType: ImageContentType }
  | { name: "working" };

export function ImageUploadField({
  requestUploadUrl,
  onUploaded,
  aspect,
  label,
}: ImageUploadFieldProps): React.ReactElement {
  const [estado, setEstado] = useState<Estado>({ name: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);

  async function subir(blob: Blob, contentType: ImageContentType): Promise<void> {
    setEstado({ name: "working" });
    setError(null);

    try {
      const preparada = await prepareImage(blob, { forAvatar: aspect !== undefined });
      const { uploadUrl, key } = await requestUploadUrl(contentType);

      await putToUploadUrl(uploadUrl, preparada, contentType);

      onUploaded(key);
      setEstado({ name: "idle" });
    } catch (fallo) {
      setError(fallo instanceof UploadError ? fallo.message : messages.uploads.failed);
      setEstado({ name: "idle" });
    }
  }

  function elegir(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    // Que el input se pueda reusar con el mismo archivo dos veces seguidas.
    event.target.value = "";

    if (file === undefined) return;

    if (!isAllowedImage(file)) {
      setError(messages.uploads.wrongType);
      return;
    }

    setError(null);

    if (aspect === undefined) {
      void subir(file, file.type);
      return;
    }

    setEstado({ name: "cropping", src: URL.createObjectURL(file), contentType: file.type });
  }

  async function confirmarRecorte(): Promise<void> {
    if (estado.name !== "cropping" || area === null) return;

    const { src, contentType } = estado;

    try {
      const recortada = await cropToBlob(src, area, contentType);
      await subir(recortada, contentType);
    } catch {
      setError(messages.uploads.failed);
      setEstado({ name: "idle" });
    } finally {
      URL.revokeObjectURL(src);
    }
  }

  function cancelarRecorte(): void {
    if (estado.name === "cropping") URL.revokeObjectURL(estado.src);
    setEstado({ name: "idle" });
  }

  if (estado.name === "cropping") {
    return (
      <div>
        <p>{messages.uploads.crop}</p>
        <div style={{ position: "relative", height: 260, background: "#333" }}>
          <Cropper
            image={estado.src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_area, pixels) => setArea(pixels)}
          />
        </div>

        <label style={{ display: "block", marginTop: "0.5rem" }}>
          {messages.uploads.zoom}
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>

        <button type="button" onClick={() => void confirmarRecorte()}>
          {messages.uploads.cropConfirm}
        </button>
        <button type="button" onClick={cancelarRecorte}>
          {messages.uploads.cancel}
        </button>
      </div>
    );
  }

  return (
    <div>
      <label>
        {label ?? messages.uploads.choose}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={estado.name === "working"}
          onChange={elegir}
        />
      </label>

      {estado.name === "working" && <p>{messages.uploads.uploading}</p>}

      {error !== null && (
        <p role="alert" style={{ color: "#b00020" }}>
          {error}
        </p>
      )}
    </div>
  );
}
