import type { ThemePreference } from "@monedin/contracts";
import { messages } from "../lib/messages.js";
import { useUpdateTheme } from "../features/auth/use-session.js";

const SIGUIENTE: Record<ThemePreference, ThemePreference> = {
  SYSTEM: "LIGHT",
  LIGHT: "DARK",
  DARK: "SYSTEM",
};

const NOMBRE: Record<ThemePreference, string> = {
  SYSTEM: messages.nav.themeSystem,
  LIGHT: messages.nav.themeLight,
  DARK: messages.nav.themeDark,
};

export function ThemeToggle({ theme }: { theme: ThemePreference }): React.ReactElement {
  const guardar = useUpdateTheme();

  return (
    <button
      type="button"
      aria-label={NOMBRE[theme]}
      disabled={guardar.isPending}
      onClick={() => guardar.mutate({ theme: SIGUIENTE[theme] })}
      className="tap-target rounded-control flex items-center justify-center px-2 text-ink-muted transition-colors duration-quick hover:text-primary disabled:opacity-55"
    >
      <Icono theme={theme} />
    </button>
  );
}

function Icono({ theme }: { theme: ThemePreference }): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {theme === "LIGHT" && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
        </>
      )}
      {theme === "DARK" && <path d="M20 13.5A8 8 0 1110.5 4a6.5 6.5 0 009.5 9.5z" />}

      {theme === "SYSTEM" && (
        <>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </>
      )}
    </svg>
  );
}
