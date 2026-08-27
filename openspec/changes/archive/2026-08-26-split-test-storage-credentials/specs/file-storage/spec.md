## ADDED Requirements

### Requirement: La batería de tests está aislada del almacén real por tres vías

La batería de tests VACÍA su bucket al arrancar. Para que eso no pueda alcanzar jamás a datos reales,
el aislamiento respecto del almacén de la aplicación SHALL sostenerse sobre **tres** separaciones
independientes, y las tres SHALL cumplirse a la vez:

1. **Bucket distinto.** El bucket de la batería SHALL ser distinto del de la aplicación, y arrancar
   con ambos iguales SHALL fallar con un mensaje que explique la consecuencia.
2. **Endpoint propio.** La batería SHALL apuntar a un endpoint declarado por su cuenta, y ese
   endpoint NO SHALL admitir el valor vacío, porque vacío significa «el almacén gestionado del
   proveedor».
3. **Credenciales propias.** La batería SHALL autenticarse con credenciales declaradas por su
   cuenta, distintas de las de la aplicación.

Ninguna de las tres es redundante: cada una tapa un camino por el que la batería podría acabar
hablando con el almacén real, y basta que falte una para que cambiar la configuración de desarrollo
arrastre a los tests.

#### Scenario: Desarrollo se pasa al proveedor real

- **WHEN** la aplicación se configura contra un almacén real, con su endpoint gestionado y sus
  credenciales
- **THEN** la batería sigue hablando con el almacén local, con su bucket y sus credenciales
- **AND** ninguna pasada de tests puede vaciar un bucket real

#### Scenario: Las credenciales de la aplicación dejan de servir para el almacén local

- **WHEN** las credenciales de la aplicación pertenecen a un proveedor distinto del que usa la batería
- **THEN** los tests de almacenamiento siguen pasando
- **AND** no fallan por autenticación

#### Scenario: El bucket de la batería coincide con el de la aplicación

- **WHEN** ambos nombres son iguales
- **THEN** la batería se niega a ejecutarse
- **AND** el mensaje explica que habría borrado los archivos con los que se está trabajando
