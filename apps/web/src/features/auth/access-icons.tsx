/**
 * Los iconos del acceso.
 *
 * Decorativos, sin excepción: lo que nombra a un campo es su etiqueta, y lo que
 * nombra al botón de envío es su `aria-label`. Por eso ninguno declara `role` ni
 * etiqueta, y el envoltorio que los coloca los oculta con `aria-hidden`.
 *
 * Trazo propio y deliberadamente simple, como el símbolo del logo: lo que tiene
 * que hacer hoy es ser nuestro y poder tirarse a la basura sin arrastrar a
 * nadie cuando llegue la identidad definitiva en `polish-brand-and-a11y`.
 */

function Trazo({ d }: { d: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-5">
      <path d={d} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AtSign(): React.ReactElement {
  return <Trazo d="M16 12a4 4 0 1 0-4 4M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1" />;
}

export function Lock(): React.ReactElement {
  return <Trazo d="M5 11h14v10H5V11Zm3 0V7a4 4 0 0 1 8 0v4" />;
}

export function Person(): React.ReactElement {
  return <Trazo d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />;
}

export function Keypad(): React.ReactElement {
  return <Trazo d="M7 4h10v16H7V4Zm3 4h.01M14 8h.01M10 12h.01M14 12h.01M10 16h.01M14 16h.01" />;
}

/** La flecha del envío. Su nombre lo pone quien la usa: sola no dice qué hace. */
export function ArrowRight(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-6">
      <path d="M5 12h14m-6-6 6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
