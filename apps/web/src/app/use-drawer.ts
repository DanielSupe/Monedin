import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function useDrawer(): { open: boolean; setOpen: (open: boolean) => void } {
  const [open, setOpen] = useState(false);
  const ruta = useRouterState({ select: (estado) => estado.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [ruta]);

  return { open, setOpen };
}
