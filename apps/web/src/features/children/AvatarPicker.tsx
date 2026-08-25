import type { AvatarKey } from "@monedin/contracts";
import { AVATAR_OPTIONS } from "../auth/avatars.js";

/**
 * Selector del animal de un perfil.
 *
 * Recorre el catálogo compartido, así que añadir o retirar una ilustración se
 * refleja aquí sin tocar nada. La API valida contra esa misma lista.
 */
export function AvatarPicker({
  value,
  onChange,
  label,
}: {
  value: AvatarKey | undefined;
  onChange: (avatar: AvatarKey) => void;
  label: string;
}): React.ReactElement {
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
    </fieldset>
  );
}
