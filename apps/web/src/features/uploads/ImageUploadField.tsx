import type { ImageContentType, UploadUrl } from "@monedin/contracts";
import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { putToUploadUrl, UploadError } from "../../lib/s3-upload.js";
import { messages } from "../../lib/messages.js";
import { Alert, Button, Slider, buttonClasses, cx } from "../../ui/index.js";
import { cropToBlob, isAllowedImage, prepareImage } from "./prepare-image.js";

interface ImageUploadFieldProps {
  requestUploadUrl: (contentType: ImageContentType) => Promise<UploadUrl>;

  onUploaded: (key: string) => void;

  aspect?: number;

  maxDimension: number;
  label?: string;

  cropNote?: string;
}

const ALTO_DEL_RECORTE = 260;

type Estado =
  | { name: "idle" }
  | { name: "cropping"; src: string; contentType: ImageContentType }
  | { name: "working" };

export function ImageUploadField({
  requestUploadUrl,
  onUploaded,
  aspect,
  maxDimension,
  label,
  cropNote,
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
      const preparada = await prepareImage(blob, maxDimension);
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

    setEstado({
      name: "cropping",
      src: URL.createObjectURL(file),
      contentType: file.type,
    });
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
      <div className="flex flex-col gap-3">
        <p className="text-small font-semibold">{messages.uploads.crop}</p>

        {cropNote !== undefined && (
          <p className="text-small text-ink-muted">{cropNote}</p>
        )}

        <div
          className="rounded-card relative overflow-hidden bg-ink"
          style={{ height: ALTO_DEL_RECORTE }}
        >
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

        <div className="flex items-center gap-3">
          <span className="text-small shrink-0 font-semibold">{messages.uploads.zoom}</span>
          <Slider
            label={messages.uploads.zoom}
            value={zoom}
            onValueChange={setZoom}
            className="min-w-0 flex-1"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => void confirmarRecorte()}>
            {messages.uploads.cropConfirm}
          </Button>
          <Button onClick={cancelarRecorte}>{messages.uploads.cancel}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">

      <label className={cx(buttonClasses("secondary"), "relative")}>
        {label ?? messages.uploads.choose}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={estado.name === "working"}
          onChange={elegir}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>

      {estado.name === "working" && (
        <p className="text-small text-ink-muted">{messages.uploads.uploading}</p>
      )}

      {error !== null && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}
