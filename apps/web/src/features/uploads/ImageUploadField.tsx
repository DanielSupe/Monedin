import type { ImageContentType, UploadUrl } from "@monedin/contracts";
import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { putToUploadUrl, UploadError } from "../../lib/s3-upload.js";
import { messages } from "../../lib/messages.js";
import { Alert, Button, buttonClasses, cx } from "../../ui/index.js";
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

/**
 * La altura del lienzo del recorte, en píxeles.
 *
 * Va aquí y no en `tokens.css` porque no es una medida del sistema: es lo que
 * `react-easy-crop` necesita para dimensionar su área, y ninguna otra pantalla
 * la usa ni debería.
 */
const ALTO_DEL_RECORTE = 260;

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
      const preparada = await prepareImage(blob, {
        forAvatar: aspect !== undefined,
      });
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

        {/*
          ESTILO EN LÍNEA, y es la TERCERA excepción del proyecto tras
          `ProgressBar` y `Orbits`. `CLAUDE.md` avisa de que cada una debilita
          la regla, así que conviene justificarla: `react-easy-crop` monta su
          lienzo dentro de este contenedor y necesita que tenga posición y una
          altura resuelta para medir su área. No hay token que exprese «lo que
          esa librería necesita para medir», y la alternativa era meter una
          utilidad de una sola pantalla en el archivo de tokens.

          Lo que SÍ se fue es el color: era `#333` literal y ahora es un token.
          La excepción cubre lo mínimo.

          Queda así respondida la pregunta que dejó abierta el design de
          `add-design-system`, en un archivo de configuración y no en la cabeza
          de alguien.
        */}
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

        <label className="text-small flex items-center gap-2 font-semibold">
          {messages.uploads.zoom}
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="min-w-0 flex-1"
          />
        </label>

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
      {/*
        El control nativo NO se enseña, y no es cuestión de aspecto.
        `input[type=file]` tiene un ancho mínimo intrínseco de unos 360px —el
        botón del sistema más «ningún archivo seleccionado»— y en una rejilla,
        donde el mínimo por defecto es `auto`, ARRASTRA A SU COLUMNA. Dos
        pantallas del niño desbordaban por él a 390px sin tenerlo en su propio
        código, y por eso el marco llevaba un parche.

        Se oculta, no se quita: sigue siendo lo que abre el selector del sistema,
        sigue alcanzable con el teclado a través de su etiqueta, y sigue
        anunciándose. `sr-only` oculta a la vista sin sacar del árbol.
      */}
      <label className={cx(buttonClasses("secondary"), "relative")}>
        {label ?? messages.uploads.choose}
        {/*
          El control CUBRE la etiqueta, transparente, en vez de esconderse en un
          rincón.

          Con `sr-only` funcionaba el teclado pero el anillo de foco se dibujaba
          sobre un cuadro de 1px que nadie ve: se tabulaba hasta él y no pasaba
          nada visible. Absoluto y a opacidad cero, el control ES la etiqueta:
          su caja de foco coincide con lo que se ve, así que el `:focus-visible`
          que el sistema ya declara sirve tal cual y no hace falta trasladar el
          anillo con `focus-within`.

          Y sigue fuera del flujo, que es lo que importaba: un elemento absoluto
          no aporta ancho mínimo, así que no arrastra a su columna.
        */}
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
