import { AVATAR_MAX_DIMENSION, type AvatarKey, type ImageContentType, type UploadUrl } from "@monedin/contracts";
import { messages } from "../../lib/messages.js";
import { Avatar, Card, cx } from "../../ui/index.js";
import { AVATAR_OPTIONS } from "../../ui/avatars.js";
import { ImageUploadField } from "../uploads/ImageUploadField.js";

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

  note?: string;

  requestUploadUrl?: (contentType: ImageContentType) => Promise<UploadUrl>;
  onUpload?: (key: string) => void;
}): React.ReactElement {
  const puedeSubir = requestUploadUrl !== undefined && onUpload !== undefined;

  return (
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

                value === option.key
                  ? "border-2 border-primary bg-primary-soft"
                  : "border-border-strong hover:bg-surface-sunken",
              )}
            >

              <Avatar value={option.key} size="small" />
            </button>
          ))}
        </div>

        {note !== undefined && !puedeSubir && (
          <p className="text-small text-ink-muted">{note}</p>
        )}

        {puedeSubir && (
          <div className="flex min-w-0 flex-col gap-3 border-t border-border pt-3">

            <p className="text-small font-semibold">{messages.uploads.orYourOwnPhoto}</p>

            <ImageUploadField
              requestUploadUrl={requestUploadUrl}
              onUploaded={onUpload}
              aspect={1}

              maxDimension={AVATAR_MAX_DIMENSION}
              label={messages.uploads.choose}
            />
          </div>
        )}
      </fieldset>
    </Card>
  );
}
