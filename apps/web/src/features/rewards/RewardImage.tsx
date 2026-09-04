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
 */
const CAJA = "rounded-card aspect-square w-full";
export function RewardImage({
  image,
  title,
}: {
  image: string | null;
  title: string;
}): React.ReactElement {
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
