import { messages } from "../../lib/messages.js";

/**
 * La foto de un premio, o su respaldo cuando no la hay.
 *
 * Antes era `reward.image !== null && <img …>` repetido en el catálogo del padre
 * y en el escaparate del niño, así que un premio sin foto dejaba un HUECO. Un
 * hueco donde las demás filas tienen imagen se lee como algo que se rompió al
 * cargar, no como un premio sin foto — y en cuanto los premios se presenten como
 * productos, una rejilla con huecos deja de ser una rejilla.
 *
 * Vive en `features/rewards/` y no en `ui/` porque sabe qué es un premio: el
 * glifo de regalo es la respuesta a «no hay foto DE UN PREMIO», no a «no hay
 * imagen».
 *
 * El respaldo NO se resuelve en la API. El servidor sigue diciendo que no hay
 * imagen, que es la verdad; qué dibujar entonces es de la interfaz. Ver la
 * decisión 6 del design de `polish-profile-and-reward-image`.
 *
 * Las dos ramas comparten UNA CAJA de proporción fija, y esa es la mitad del
 * arreglo de la rejilla que el recorte no cubre. Recortar al subir endereza las
 * fotos NUEVAS; las que ya están subidas conservan la proporción con la que
 * entraron, y sin caja fija una apaisada seguiría descuadrando su fila.
 *
 * `object-cover` las encuadra al mostrarlas, sin deformarlas y sin reprocesar
 * nada en el almacén. Ver la decisión 3 del design de `crop-reward-images`.
 */

/**
 * La caja, en un solo sitio.
 *
 * Estaba escrita dos veces —`max-h-40` para la foto y `h-40` para el respaldo—,
 * y eran distintas: la de la foto era un MÁXIMO, así que su altura real dependía
 * de la proporción. Con dos declaraciones, una fila con foto y otra sin ella
 * medían cosas distintas.
 *
 * El TOPE de ancho vive aquí y no en quien la coloca, y eso se aprendió por las
 * malas: siendo cuadrada y a ancho completo, en el catálogo del padre —donde la
 * tarjeta ocupa la fila entera— salía un cuadrado del tamaño de la columna. El
 * escaparate del niño no lo sufría porque su tesela ya venía topada, así que el
 * defecto solo asomó en el otro sitio. Con el tope dentro, la pieza no puede
 * reventar en el siguiente sitio donde alguien la use.
 */
/**
 * DOS TALLAS, Y LAS DECLARA LA PIEZA.
 *
 * `tile` es la de siempre: el cuadrado topado del escaparate del niño, donde la
 * foto es lo que se mira y dos precios se comparan de un vistazo.
 *
 * `thumb` nació del catálogo del padre. Allí la tarjeta es horizontal y lo que
 * se mira es a quién se ofrece y por cuánto; con la talla grande, cada premio
 * SIN foto —el estado normal de una familia que empieza— se comía trescientos
 * píxeles de alto para enseñar un cuadro vacío, y cuatro premios no cabían en
 * una pantalla.
 *
 * Es una TALLA de la pieza y no una clase pasada desde fuera, por lo mismo que
 * el tope de ancho vive aquí: quien la coloca no decide su caja. `cx` no fusiona
 * utilidades, así que un `size-24` de fuera contra el `w-full` de dentro lo
 * resolvería el orden del CSS generado.
 */
export type RewardImageSize = "tile" | "thumb";

const CAJAS: Record<RewardImageSize, string> = {
  // `mx-auto`: la caja está topada, así que en una tarjeta más ancha que ella
  // —la del catálogo del padre— se quedaba pegada a la izquierda.
  tile: "rounded-card mx-auto aspect-square w-full max-w-tile",
  thumb: "rounded-card aspect-square size-24 shrink-0",
};

export function RewardImage({
  image,
  title,
  size = "tile",
}: {
  image: string | null;
  title: string;
  size?: RewardImageSize;
}): React.ReactElement {
  const CAJA = CAJAS[size];
  if (image !== null) {
    return <img src={image} alt={title} className={`${CAJA} object-cover`} />;
  }

  /*
   * `aria-hidden` en el glifo: no aporta nada que el título del premio no diga
   * ya, y anunciar «regalo» delante de cada premio sin foto es ruido para quien
   * lo escucha. Misma decisión que las teselas del inicio del niño.
   */
  return (
    <div
      className={`${CAJA} flex items-center justify-center bg-surface-sunken`}
      data-testid="reward-image-fallback"
    >
      <span aria-hidden="true" className="text-hero leading-none">
        {messages.rewards.imageFallbackGlyph}
      </span>
    </div>
  );
}
