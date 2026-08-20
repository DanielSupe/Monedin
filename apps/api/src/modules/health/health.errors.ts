/**
 * Errores de dominio del módulo `health`.
 *
 * Está vacío a propósito: una sonda de vida no tiene forma de fallar por una
 * regla de negocio. El archivo existe porque la anatomía de módulo es la misma
 * para todos y `health` es la plantilla que copian los módulos de dominio.
 *
 * Un módulo real declara aquí sus errores propios extendiendo las clases de
 * `shared/errors`, y NO define ningún mapeo a HTTP: eso ya está resuelto.
 */
export {};
