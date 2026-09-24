import { useEffect } from "react";
import type { ThemePreference } from "@monedin/contracts";

export function useTheme(theme: ThemePreference | undefined): void {
  useEffect(() => {
    const raiz = document.documentElement;

    if (theme === "LIGHT" || theme === "DARK") {
      raiz.setAttribute("data-theme", theme.toLowerCase());
    } else {
      raiz.removeAttribute("data-theme");
    }

    return () => {
      raiz.removeAttribute("data-theme");
    };
  }, [theme]);
}
