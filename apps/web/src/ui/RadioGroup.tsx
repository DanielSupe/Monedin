import * as RadixRadioGroup from "@radix-ui/react-radio-group";
import { cx } from "./cx.js";

export interface RadioOption {
  value: string;
  label: string;
  /** Una línea que aclara qué implica elegir esto. Opcional. */
  hint?: string;
}

export interface RadioGroupProps {
  /**
   * Qué se está eligiendo. SE VE Y SE OYE.
   *
   * Era solo un `aria-label`, o sea que existía para quien no mira la pantalla y
   * no para quien la mira — el mismo defecto que el acceso a la ayuda tenía en la
   * cabecera. Y aquí se notaba más: las dos opciones son «el mismo valor para
   * todos» y «uno para cada uno», que sin la pregunta delante no dicen el mismo
   * valor DE QUÉ.
   */
  label: string;
  options: RadioOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

/**
 * Elegir UNA opción de varias, cuando las dos caben en pantalla.
 *
 * Sobre Radix, que es lo que aporta lo difícil: las flechas mueven la selección
 * dentro del grupo, el tabulador entra y sale del grupo entero —no opción por
 * opción—, y el grupo se anuncia con su nombre antes de leer las opciones.
 * Escribir eso a mano es donde se rompen los formularios.
 *
 * Es una pieza aparte de `Select` y no una variante suya: un desplegable esconde
 * las opciones hasta que se abre, y esto existe justo para lo contrario. Con dos
 * o tres opciones que hay que COMPARAR —«el mismo valor para todos» frente a «uno
 * para cada uno»— esconderlas obliga a abrir para decidir.
 *
 * EL NOMBRE DE CADA OPCIÓN SE ATA A MANO, igual que en `Checkbox` y por lo mismo:
 * lo que Radix dibuja es un `<button role="radio">` vacío, y el nombre de un
 * botón sale de su contenido antes que del `<label>` que lo envuelve. Sin esto,
 * las dos opciones se anuncian sin nombre.
 */
export function RadioGroup({
  label,
  options,
  value,
  onValueChange,
  className,
}: RadioGroupProps): React.ReactElement {
  /*
   * El nombre se dibuja Y se sigue atando con `aria-label`, que no es
   * redundante: lo que Radix pinta es un `div[role=radiogroup]`, y un texto
   * puesto al lado no lo nombra por estar cerca.
   */
  return (
    <div className="flex flex-col gap-2">
      <span className="text-body font-bold text-ink">{label}</span>

      <RadixRadioGroup.Root
        aria-label={label}
        value={value}
        onValueChange={onValueChange}
        className={cx("flex flex-col gap-2 sm:flex-row", className)}
      >
        {options.map((opcion) => {
          const elegida = opcion.value === value;

          return (
            <label
              key={opcion.value}
              className={cx(
                "rounded-control tap-target flex flex-1 cursor-pointer items-center gap-3 border-2 px-3 py-2 transition duration-quick",
                elegida
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-surface-raised hover:bg-surface-sunken",
              )}
            >
              <RadixRadioGroup.Item
                value={opcion.value}
                aria-label={opcion.label}
                className={cx(
                  "rounded-pill flex size-5 shrink-0 items-center justify-center border-2",
                  elegida ? "border-primary" : "border-border-strong",
                )}
              >
                {/* El punto va DENTRO del indicador de Radix: así solo existe
                  cuando la opción está elegida, y no hace falta una rama. */}
                <RadixRadioGroup.Indicator className="rounded-pill block size-2.5 bg-primary" />
              </RadixRadioGroup.Item>

              <span className="flex min-w-0 flex-col">
                <span className="text-body font-semibold">{opcion.label}</span>
                {opcion.hint !== undefined && (
                  <span className="text-small text-ink-muted">
                    {opcion.hint}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </RadixRadioGroup.Root>
    </div>
  );
}
