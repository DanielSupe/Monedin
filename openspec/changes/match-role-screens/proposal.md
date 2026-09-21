# Ajustar las pantallas del padre y del niño a sus maquetas

## Why

Cerradas las ocho compartidas, quedan las **quince del padre y las nueve del
niño**. Comparando el texto visible de cada una con el de su maqueta aparecen dos
clases de diferencia, y la primera no es de ninguna pantalla:

**Las fechas.** Cuatro sitios las escriben y de tres maneras distintas. Dos
llaman a `toLocaleDateString()` a secas, que da `21/9/2026`; uno pide día y mes
abreviado; y **los cuatro pasan la configuración regional del DISPOSITIVO**. O
sea que un producto entero en español imprime `9/21/2026` en un teléfono en
inglés. Las maquetas escriben «Repartida el 7 de septiembre».

**El acceso a la ayuda.** En las maquetas es una entrada con su nombre al pie del
lateral; en la aplicación es un icono sin palabra en la cabecera — el mismo
defecto que `add-sidebar-nav` arregló para los otros cinco destinos y que este se
saltó.

Y después, pantalla por pantalla, lo que cada una tenga.

## What Changes

- **Una sola función escribe las fechas del producto**, con el idioma del
  producto y no el del dispositivo, y las cuatro pantallas la usan.
- **La ayuda pasa a ser un destino del lateral**, con su nombre, y deja de
  colgar de un icono de la cabecera.
- **Las quince del padre y las nueve del niño**, comparadas una a una y ajustadas
  en contenido y jerarquía.

## Impact

- `apps/web/src/lib/` gana la función de fecha; las cuatro pantallas que la
  escribían dejan de decidirlo.
- Los dos marcos y el test que enumera los destinos de cada rol.
- `apps/web/src/features/` en las pantallas que se vayan tocando.

## No incluye

- **El color**, que va aparte y afecta también a las compartidas.
- **El contraste del coral**, que espera una decisión de marca. Ver la pregunta
  abierta del design de `match-shared-screens`.
- **El saldo del niño como píldora de la cabecera.** La maqueta lo pone ahí y un
  requisito vigente dice que es el elemento más grande de su inicio.
