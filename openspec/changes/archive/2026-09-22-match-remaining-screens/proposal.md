# Cerrar las diferencias que solo se ven abriendo cada pantalla

## Why

Las treinta y dos se habían comparado **midiendo** —texto por texto y tamaño por
tamaño— y solo catorce se habían abierto en el navegador. Al abrir el resto una
por una contra su artboard salieron cinco diferencias que ninguna medición podía
dar, porque son de forma y de jerarquía y no de contenido.

## What Changes

- **La tarjeta de un premio pasa a ser horizontal** en el catálogo del padre, con
  la foto pequeña y las ofertas como píldoras en línea.
- **El historial de un hijo dice de quién es** y qué hacer con un movimiento
  equivocado.
- **El panel del padre deja de dar el mismo peso** a gestionar perfiles y a
  cambiar de perfil.

## Impact

- `apps/web/src/features/rewards/` —el catálogo y la pieza de la imagen—,
  `apps/web/src/features/coins/` y `apps/web/src/features/parents/`.
- `RewardImage` gana una talla; `CoinHistory`, una nota opcional.

## No incluye

- **El saldo como píldora ámbar** en la lista de hijos del panel. La maqueta lo
  dibuja así y la aplicación lo escribe suelto. Es decoración y entra en el
  repaso de color, no aquí.
- **El «Retirar» perfilado** en vez de sólido. Exigiría una variante de `Button`
  para una diferencia de énfasis, y las variantes se nombran por su papel.
