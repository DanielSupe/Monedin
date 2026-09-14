## ADDED Requirements

### Requirement: La puerta pública se lee a su propia escala

La puerta pública SHALL declararse como una audiencia propia del sistema de escalas, y NO SHALL
adoptar la del padre ni la del niño.

Se lee de pie, de un vistazo y por alguien que todavía no es nadie en el producto. Sus titulares
superan al mayor de las dos audiencias existentes, y estirar una de ellas para acomodarlos la
deformaría en todas las pantallas que la usan por culpa de una sola.

La raíz de la página NO SHALL adoptar la escala de un rol. Dentro sí puede haber maquetas que enseñen
las dos audiencias del producto: eso es contenido que ilustra la diferencia, no la página adoptando
un rol.

#### Scenario: Se abre la puerta pública

- **WHEN** se carga la página
- **THEN** sus tamaños salen de su propia escala
- **AND** las escalas del padre y del niño conservan sus valores

#### Scenario: La página enseña las dos caras del producto

- **WHEN** la página muestra una maqueta del panel del padre y otra del inicio del niño
- **THEN** cada maqueta declara la escala de su audiencia
- **AND** la raíz de la página no declara ninguna de las dos
