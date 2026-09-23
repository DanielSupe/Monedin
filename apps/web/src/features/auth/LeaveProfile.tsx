import { messages } from "../../lib/messages.js";
import { Button } from "../../ui/index.js";
import type { ButtonVariant } from "../../ui/index.js";
import { useLeaveProfile } from "./use-session.js";

/**
 * Volver a la rejilla.
 *
 * No navega: salir pone el actor a nulo, y la guarda de la ruta reevaluada
 * manda sola a la rejilla. Lo mismo vale para cerrar sesión.
 *
 * Traía un respaldo `mt-4` —la traducción literal del `marginTop: "1rem"` que
 * tuvo suelto— con la condición escrita de que existía «solo mientras quien la
 * usa siga sin vestir». `redesign-parent-home` vistió al último de sus dos
 * usuarios, así que el respaldo se va y la pieza declara su propia variante,
 * como `SignOut`.
 */
export function LeaveProfile({
  variant = "ghost",
  block = false,
}: {
  /**
   * El PESO lo decide quien la coloca, porque no es el mismo en las dos.
   *
   * En el inicio del PADRE es lo más ligero de la pantalla y no su segunda
   * acción: junto a «Gestionar perfiles» con el mismo peso, las dos se leían
   * como una pareja de botones — el mismo error, en pequeño, que ya se arregló
   * separando cambiar de perfil de cerrar sesión.
   *
   * En el del NIÑO no compite con nada: cierra la columna de apoyo, y su maqueta
   * la dibuja como un botón de ancho completo.
   */
  variant?: ButtonVariant;
  block?: boolean;
} = {}): React.ReactElement {
  const leave = useLeaveProfile();

  return (
    /*
      Sigue siendo un BOTÓN aunque a veces lo parezca menos: salir del perfil es
      una mutación, no una dirección.
    */
    <Button
      variant={variant}
      block={block}
      className={block ? undefined : "self-start"}
      pending={leave.isPending}
      onClick={() => leave.mutate()}
    >
      {messages.auth.changeProfile}
    </Button>
  );
}
