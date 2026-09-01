/**
 * Los iconos de la navegación.
 *
 * Decorativos, sin excepción: lo que nombra a un destino es su texto, y quien
 * los coloca los oculta con `aria-hidden`. Un icono que repitiera el nombre lo
 * diría dos veces a un lector de pantalla.
 *
 * Misma convención de trazo que `features/auth/access-icons.tsx`, y
 * deliberadamente igual de simple: lo que tienen que hacer hoy es ser nuestros y
 * poder tirarse a la basura sin arrastrar a nadie cuando llegue la identidad
 * definitiva.
 *
 * El ayudante `Trazo` está duplicado ahí y aquí, seis líneas, y es a propósito:
 * `app/` no conoce `features/` —esa frontera la dejó escrita `redesign-child-home`—
 * así que importarlo sería romper una regla para ahorrar seis líneas. La
 * duplicación tiene DUEÑO: `polish-brand-and-a11y` unifica el sistema de iconos,
 * que es el change que la cabecera de `access-icons` ya nombra para tirar aquel
 * archivo.
 */

function Trazo({ d }: { d: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-5 shrink-0">
      <path d={d} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Inicio: una casa. */
export function IconHome(): React.ReactElement {
  return <Trazo d="M4 11 12 4l8 7M6 10v10h12V10M10 20v-6h4v6" />;
}

/** Tareas: una lista con una marca. */
export function IconTasks(): React.ReactElement {
  return <Trazo d="M4 6h10M4 12h10M4 18h7M16 17l2 2 4-4" />;
}

/** Premios: un regalo con su lazo. */
export function IconRewards(): React.ReactElement {
  return <Trazo d="M4 10h16v10H4V10Zm0-3h16v3H4V7Zm8 0v13M12 7c-3 0-4-3-2-3.6C11.6 3 12 7 12 7Zm0 0c3 0 4-3 2-3.6C12.4 3 12 7 12 7Z" />;
}

/** Canjes: un cupón con su muesca. */
export function IconRedemptions(): React.ReactElement {
  return <Trazo d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7Zm10 0v10" />;
}

/** Hijos: dos personas. */
export function IconChildren(): React.ReactElement {
  return (
    <Trazo d="M3 20v-1a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v1M8 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm8 14v-1a4 4 0 0 0-2-3.4M15 6.2a3 3 0 0 1 0 5.6" />
  );
}

/** Mi cuenta: una persona con engranaje reducido a un punto. */
export function IconAccount(): React.ReactElement {
  return <Trazo d="M4 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1M10 4a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm9 10.5v.01M19 17v.01M17.5 15.7v.01M20.5 15.7v.01" />;
}

/** Mi perfil: una cara. */
export function IconProfile(): React.ReactElement {
  return <Trazo d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm-3 7h.01M15 10h.01M8.5 14.5a4.5 4.5 0 0 0 7 0" />;
}
