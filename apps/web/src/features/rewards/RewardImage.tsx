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
 */
export function RewardImage({
  image,
  title,
}: {
  image: string | null;
  title: string;
}): React.ReactElement {
  if (image !== null) {
    return <img src={image} alt={title} className="rounded-card max-h-40 w-full object-cover" />;
  }

  /*
   * `aria-hidden` en el glifo: no aporta nada que el título del premio no diga
   * ya, y anunciar «regalo» delante de cada premio sin foto es ruido para quien
   * lo escucha. Misma decisión que las teselas del inicio del niño.
   */
  return (
    <div
      className="rounded-card flex h-40 w-full items-center justify-center bg-surface-sunken"
      data-testid="reward-image-fallback"
    >
      <span aria-hidden="true" className="text-hero leading-none">
        {messages.rewards.imageFallbackGlyph}
      </span>
    </div>
  );
}
