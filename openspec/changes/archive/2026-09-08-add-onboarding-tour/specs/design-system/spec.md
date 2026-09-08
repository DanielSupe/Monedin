## ADDED Requirements

### Requirement: El sistema ofrece destacar una parte de la pantalla

El sistema SHALL ofrecer una pieza que atenúe la pantalla y deje **destacada** una parte de ella, con
un panel al lado que la explique. Una pantalla que necesite esa forma SHALL usarla y NO SHALL
escribir la suya.

El diálogo que ya existe no sirve: cubre la pantalla entera y centra su tarjeta, que es exactamente
lo contrario de lo que hace falta. Lo que sí se reutiliza es su comportamiento —foco atrapado, cierre
con la tecla de escape, resto del documento inerte y anuncio por su título—, que su propia
documentación advierte que no se escribe bien a mano y que roto no se nota hasta que alguien lo
necesita de verdad.

La pieza SHALL recibir **dónde destacar** y **qué decir**, y NO SHALL saber de dominio: ni de
perfiles, ni de roles, ni de qué pantalla la monta. Es la misma frontera que impide a la paginación
construir sus propios enlaces.

Cuando no se le diga dónde destacar, SHALL mostrar su panel centrado y atenuar la pantalla entera.

El movimiento entre una posición y la siguiente SHALL respetar la preferencia de movimiento reducido.

#### Scenario: Se destaca una parte de la pantalla

- **WHEN** se monta la pieza indicando una parte de la pantalla
- **THEN** el resto queda atenuado y esa parte no
- **AND** el panel se anuncia con su título

#### Scenario: Sin nada que destacar

- **WHEN** se monta la pieza sin indicar ninguna parte
- **THEN** atenúa la pantalla entera y centra su panel

#### Scenario: La pieza no sabe de dominio

- **WHEN** se revisan sus importaciones
- **THEN** no importa nada de las capas de negocio ni de datos

#### Scenario: La pieza está en el catálogo vivo

- **WHEN** se abre el catálogo de piezas
- **THEN** la pieza aparece, con y sin algo destacado
