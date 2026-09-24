import type { FamilyRole } from "@monedin/contracts";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { messages } from "../lib/messages.js";
import { useReducedMotion } from "./use-reduced-motion.js";
import { LINES, WIDGET_ROTATION_MS, areaOf, offersAssistant } from "./widget-lines.js";

export function MonedinWidget({ role }: { role: FamilyRole }): React.ReactElement | null {
  const area = useRouterState({ select: (estado) => areaOf(estado.location.pathname) });
  const sinMovimiento = useReducedMotion();
  const [indice, setIndice] = useState(0);

  const linea = LINES[role][area];

  useEffect(() => {
    setIndice(0);
  }, [area, role]);

  useEffect(() => {
    if (sinMovimiento || linea.length < 2) {
      return;
    }

    const temporizador = setInterval(() => {
      setIndice((actual) => (actual + 1) % linea.length);
    }, WIDGET_ROTATION_MS);

    return () => clearInterval(temporizador);
  }, [sinMovimiento, linea.length, area, role]);

  if (!offersAssistant(area)) {
    return null;
  }

  const actual = linea[indice] ?? linea[0];
  if (actual === undefined) {
    return null;
  }

  return (
    <div
      data-widget="monedin"
      className="z-widget pointer-events-none fixed bottom-0 right-0 flex justify-end p-4"
    >

      <Link
        to="/assistant"
        aria-label={messages.widget.openChat}
        className="rounded-panel pointer-events-auto flex max-w-tile items-center gap-2 border border-border bg-surface-raised p-2 no-underline shadow-raised transition-colors duration-normal hover:border-primary"
      >
        <p
          aria-hidden="true"
          key={actual.text}
          className="text-small m-0 text-ink motion-safe:animate-fade-in"
        >
          {actual.text}
        </p>
        <img src={actual.image} alt="" aria-hidden="true" className="h-16 w-auto shrink-0" />
      </Link>
    </div>
  );
}
