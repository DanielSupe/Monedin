import { AVATAR_KEYS, type AvatarKey, resolveAvatarKey } from "@monedin/contracts";

/**
 * Los doce animales del catálogo, dibujados.
 *
 * Eran emojis, y el motivo del cambio no es estético: **un emoji lo pinta cada
 * sistema operativo a su manera**, así que el mismo perfil se veía distinto en
 * la tablet compartida y en el portátil del padre. A un niño de seis años su
 * cara es cómo reconoce cuál es su perfil en la rejilla.
 *
 * Las claves salen de `@monedin/contracts`, que es la única lista: la API valida
 * contra ella y aquí solo se resuelve cada clave a algo que pintar. Añadir una
 * ilustración se hace allí y este archivo la acompaña — ni la base de datos ni
 * la validación saben cómo se pinta un avatar, que es lo que el comentario de la
 * versión con emojis ya prometía.
 *
 * LOS COLORES DE UN ANIMAL SON SUYOS y no del tema. No entran en la paleta de
 * dos tonos ni se reasignan en oscuro: un avatar es contenido, como una foto.
 * Lo que sí sigue al tema es el círculo sobre el que se dibuja, y eso lo pone
 * `Avatar`.
 *
 * Todos comparten lienzo de 40×40 y ocupan la misma caja óptica, o en una fila
 * de perfiles unos se verían mayores que otros sin que nadie lo hubiera decidido.
 */
const DIBUJOS: Record<AvatarKey, React.ReactElement> = {
  zorro: (
    <>
      <path d="M8 9l5 6h14l5-6 1 11c0 8-5 13-13 13S7 28 7 20z" fill="#EE8B4A" />
      <path d="M13 15h14l.6 6c0 6-3.6 10-7.6 10s-7.6-4-7.6-10z" fill="#FFE7D2" />
      <circle cx="16" cy="21" r="2" fill="#3A2A16" />
      <circle cx="24" cy="21" r="2" fill="#3A2A16" />
      <ellipse cx="20" cy="24.3" rx="1.9" ry="1.4" fill="#3A2A16" />
    </>
  ),
  panda: (
    <>
      <circle cx="11.5" cy="11" r="4.6" fill="#2F3446" />
      <circle cx="28.5" cy="11" r="4.6" fill="#2F3446" />
      <circle cx="20" cy="21" r="12" fill="#FFFFFF" />
      <ellipse cx="14.6" cy="19.4" rx="3.5" ry="4.2" fill="#2F3446" />
      <ellipse cx="25.4" cy="19.4" rx="3.5" ry="4.2" fill="#2F3446" />
      <circle cx="15" cy="19.4" r="1.4" fill="#FFFFFF" />
      <circle cx="25" cy="19.4" r="1.4" fill="#FFFFFF" />
      <ellipse cx="20" cy="25" rx="2.2" ry="1.6" fill="#2F3446" />
    </>
  ),
  lechuza: (
    <>
      <path d="M20 6c7 0 11 5.5 11 12.5S27 33 20 33 9 25.5 9 18.5 13 6 20 6z" fill="#A98A5E" />
      <circle cx="15.2" cy="18" r="5" fill="#FFF6E6" />
      <circle cx="24.8" cy="18" r="5" fill="#FFF6E6" />
      <circle cx="15.2" cy="18" r="2.3" fill="#2F3446" />
      <circle cx="24.8" cy="18" r="2.3" fill="#2F3446" />
      <path d="M20 21.5l-2.4 3h4.8z" fill="#E8A33C" />
    </>
  ),
  pulpo: (
    <>
      <path d="M20 7c6.5 0 10.5 4.5 10.5 10v4h-21v-4C9.5 11.5 13.5 7 20 7z" fill="#B07BD8" />
      <path
        d="M9.5 21c0 4 1.5 6 3 8m5-8c0 4-.5 6.5-1.5 9m7.5-9c0 4 .5 6.5 1.5 9m4.5-9c0 4-1.5 6-3 8"
        fill="none"
        stroke="#B07BD8"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="2.4" fill="#3A2A46" />
      <circle cx="24" cy="16" r="2.4" fill="#3A2A46" />
      <path
        d="M17.6 20.4c1.6 1.2 3.2 1.2 4.8 0"
        fill="none"
        stroke="#3A2A46"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </>
  ),
  ballena: (
    <>
      <path d="M8 18c0-5 5.5-8.5 12.5-8.5S33 13 33 18.5 27 29 20 29 8 25 8 18z" fill="#6C9BD8" />
      <path d="M8.5 18.5L3 13v12z" fill="#5A88C4" />
      <path
        d="M22 9.5c0-2.5 1.5-4 3-4.5"
        fill="none"
        stroke="#9DC2EC"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="14" cy="18" r="1.9" fill="#22364E" />
      <path
        d="M11 22.5c2.5 1.6 5 1.6 7.5 0"
        fill="none"
        stroke="#22364E"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </>
  ),
  koala: (
    <>
      <circle cx="9" cy="14" r="5.5" fill="#9AA3AE" />
      <circle cx="31" cy="14" r="5.5" fill="#9AA3AE" />
      <circle cx="9" cy="14" r="3" fill="#C6CDD6" />
      <circle cx="31" cy="14" r="3" fill="#C6CDD6" />
      <circle cx="20" cy="21" r="11" fill="#B7BEC8" />
      <circle cx="16" cy="19.5" r="1.9" fill="#2F3446" />
      <circle cx="24" cy="19.5" r="1.9" fill="#2F3446" />
      <ellipse cx="20" cy="24.5" rx="3" ry="3.6" fill="#4A4F58" />
    </>
  ),
  erizo: (
    <>
      <path d="M5 26c1-9 7-15 15-15s14 6 15 15z" fill="#8A6B4E" />
      <path
        d="M9 17l-2-5m6 2l-1-6m6 4V6m6 6l1-6m5 9l2-5"
        fill="none"
        stroke="#6B5038"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M20 26c5 0 9 0 12 0-1 3-5 5-12 5s-11-2-12-5c3 0 7 0 12 0z" fill="#E4CBA8" />
      <circle cx="16" cy="23" r="1.7" fill="#2F3446" />
      <circle cx="24" cy="23" r="1.7" fill="#2F3446" />
      <ellipse cx="20" cy="27.5" rx="1.8" ry="1.3" fill="#2F3446" />
    </>
  ),
  mapache: (
    <>
      <path d="M8 12l4 4h16l4-4 1 9c0 8-5 12-13 12S7 29 7 21z" fill="#8E96A2" />
      <path d="M11.5 19.5c1.5-2.5 4-3 5.5-1.5s.5 4.5-2 5.5-4.5-1.5-3.5-4z" fill="#2F3446" />
      <path d="M28.5 19.5c-1.5-2.5-4-3-5.5-1.5s-.5 4.5 2 5.5 4.5-1.5 3.5-4z" fill="#2F3446" />
      <circle cx="15" cy="20.5" r="1.5" fill="#FFFFFF" />
      <circle cx="25" cy="20.5" r="1.5" fill="#FFFFFF" />
      <ellipse cx="20" cy="26" rx="2" ry="1.5" fill="#2F3446" />
    </>
  ),
  tucan: (
    <>
      {/*
        EL CUERPO NO VA EN LA TINTA DE LOS OJOS, y era el único que lo hacía.

        Un tucán es negro, así que su cuerpo se dibujó con `#2F3446` —el mismo
        valor que los ojos y los hocicos de los otros once—. Sobre el círculo de
        arena se leía; sobre el oscuro, que está a ese mismo valor, el pájaro
        desaparecía y quedaban flotando un ojo y un pico.

        Y NO se arregla reasignándolo por tema: un animal es contenido, como una
        foto, y esa regla es la que hace que un zorro naranja siga siendo naranja
        de noche. Se arregla eligiendo un valor que se lea sobre los dos fondos,
        que es lo que ya hacen los otros once. Lo que identifica a un tucán es su
        pico, y ese no se toca.

        Lo cazó abrir el catálogo en oscuro, que es justo para lo que esa tarea
        existe: ningún test puede verlo, porque jsdom no pinta.
      */}
      <path d="M14 12c6 0 11 4.5 11 10.5S20 33 14 33 3 28.5 3 22.5 8 12 14 12z" fill="#55658A" />
      <path d="M24 17c4-2 9-2.5 13 .5-3.5 3-8 4.5-13 4z" fill="#EE8B4A" />
      <path
        d="M24 19.5c3-1 6-1 8.5.5"
        fill="none"
        stroke="#C96A28"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="17" cy="18.5" r="3.4" fill="#FFF6E6" />
      <circle cx="17.6" cy="18.5" r="1.8" fill="#2F3446" />
    </>
  ),
  camaleon: (
    <>
      <path d="M12 14c6-3 13-2 16 3 2.5 4 1 9-4 11-4.5 1.8-9 .5-11-2z" fill="#7FB562" />
      <path
        d="M13 26c-4 3-8 2-9-1.5-.8-3 1.5-5 3.5-4.2 1.6.6 1.8 2.6.4 3.4"
        fill="none"
        stroke="#7FB562"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M26 12l4-3m-4 6l5-1"
        fill="none"
        stroke="#5E8F45"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="24" cy="18.5" r="3.6" fill="#C8E4B2" />
      <circle cx="24.6" cy="18.5" r="1.8" fill="#2F3446" />
    </>
  ),
  nutria: (
    <>
      <ellipse cx="20" cy="21" rx="11.5" ry="12" fill="#9A7355" />
      <circle cx="11" cy="11.5" r="3.6" fill="#7E5C42" />
      <circle cx="29" cy="11.5" r="3.6" fill="#7E5C42" />
      <ellipse cx="20" cy="25.5" rx="7" ry="5.5" fill="#E4CBA8" />
      <circle cx="16" cy="19" r="1.9" fill="#2F3446" />
      <circle cx="24" cy="19" r="1.9" fill="#2F3446" />
      <ellipse cx="20" cy="23.5" rx="2" ry="1.5" fill="#2F3446" />
      <path d="M20 25v2" fill="none" stroke="#2F3446" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  ajolote: (
    <>
      <circle cx="20" cy="21" r="11.5" fill="#F2A9C4" />
      <path
        d="M9 15c-3-2.5-6-2.5-8-.5m8 5.5c-3.5-1-6.5 0-8 2m9 3.5c-3 1-5 3-5.5 5.5"
        fill="none"
        stroke="#E888AC"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M31 15c3-2.5 6-2.5 8-.5m-8 5.5c3.5-1 6.5 0 8 2m-9 3.5c3 1 5 3 5.5 5.5"
        fill="none"
        stroke="#E888AC"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="16" cy="19.5" r="1.9" fill="#3A2A46" />
      <circle cx="24" cy="19.5" r="1.9" fill="#3A2A46" />
      <path
        d="M17 24.5c2 1.6 4 1.6 6 0"
        fill="none"
        stroke="#3A2A46"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </>
  ),
};

/**
 * El dibujo de un avatar, listo para meter en su círculo.
 *
 * Decorativo: quien nombra al perfil es el texto que lo acompaña, y `Avatar` ya
 * pone el nombre accesible cuando hace falta. Un dibujo anunciado junto a su
 * nombre diría la misma cosa dos veces.
 */
export function avatarDrawing(key: string | null | undefined): React.ReactElement {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false" className="size-3/4">
      {DIBUJOS[resolveAvatarKey(key)]}
    </svg>
  );
}

/**
 * Si lo que llegó es una foto propia y no una clave del catálogo.
 *
 * El servidor entrega una de las dos cosas, ya resuelta: o una clave corta o
 * una URL firmada. Ninguna clave del catálogo empieza por `http`, así que
 * distinguirlas es exactamente esto y no hace falta un campo aparte que
 * mantener sincronizado.
 */
export function isAvatarUrl(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith("http");
}

/** Todas las opciones, para el selector al crear o editar un perfil. */
/*
 * EL CATÁLOGO DE OPCIONES LLEVA SOLO LA CLAVE, y llevaba además el dibujo crudo.
 *
 * Ese `drawing` eran los `<path>` sueltos, SIN el `<svg>` que los hace visibles
 * —quien lo pone es `avatarDrawing`—, así que quien lo pintara tal cual no
 * dibujaba nada. Pasó: la rejilla de animales del alta de un perfil salía con
 * doce cajas vacías, y ningún test lo dijo porque jsdom no pinta y los botones
 * seguían teniendo su nombre.
 *
 * Exponer un fragmento a medio montar es la trampa. Quien necesite dibujar un
 * avatar usa `Avatar`, que es la única forma que hay de hacerlo.
 */
export const AVATAR_OPTIONS = AVATAR_KEYS.map((key) => ({ key }));
