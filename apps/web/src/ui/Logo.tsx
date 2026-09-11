import { messages } from "../lib/messages.js";
import { CoinMark } from "./coin-mark.js";
import { cx } from "./cx.js";

export type LogoSize = "small" | "medium" | "large";

/** Las tres medidas del sistema. Ninguna pantalla pide píxeles. */
const SIZES: Record<LogoSize, { texto: string; marca: string }> = {
  small: { texto: "text-body", marca: "size-6" },
  medium: { texto: "text-title", marca: "size-8" },
  large: { texto: "text-hero", marca: "size-12" },
};

export interface LogoProps {
  size?: LogoSize;
  /** Solo el símbolo, sin el nombre. Para donde no cabe la palabra. */
  markOnly?: boolean;
  className?: string;
}

/**
 * La marca de Monedín: el símbolo de la moneda y el nombre.
 *
 * Una sola pieza para los tres sitios que la muestran —la puerta pública y los
 * dos marcos de la aplicación—, donde antes «Monedín» era un `<span>` con texto
 * suelto repetido. Cuando llegue la identidad definitiva en
 * `polish-brand-and-a11y`, cambiarla será sustituir este archivo y nada más.
 *
 * El símbolo es un SVG propio y deliberadamente simple: una moneda con la inicial
 * dentro. No es una ilustración, y no pretende serlo: lo que tiene que hacer hoy
 * es ser nuestro, escalar bien y poder tirarse a la basura sin arrastrar a nadie.
 */
export function Logo({
  size = "medium",
  markOnly = false,
  className,
}: LogoProps): React.ReactElement {
  const medida = SIZES[size];

  return (
    <span
      // El nombre se anuncia una vez, aquí, y el SVG queda oculto: sin esto un
      // lector diría «imagen» y luego «Monedín», o solo «imagen».
      role="img"
      aria-label={messages.app.title}
      className={cx("inline-flex items-center gap-2 font-extrabold text-ink", medida.texto, className)}
    >
      {/*
        El símbolo lo dibuja `CoinMark`, que comparte con `Coins`. Son la MISMA
        moneda: tenerla escrita dos veces es cómo la marca y el saldo acaban
        enseñando dos monedas distintas sin que nadie lo decida.
      */}
      <CoinMark withRing className={medida.marca} />

      {!markOnly && <span aria-hidden="true">{messages.app.title}</span>}
    </span>
  );
}
