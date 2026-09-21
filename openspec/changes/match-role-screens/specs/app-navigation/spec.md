# app-navigation

## ADDED Requirements

### Requirement: La ayuda es un destino con nombre, no un icono

El acceso a la ayuda SHALL ser un destino de la navegación del perfil, con su nombre a la vista, y NO
SHALL alcanzarse únicamente pulsando un icono sin palabra.

Es el mismo argumento que dejó escrito la navegación de un perfil para los otros cinco destinos: uno
que solo se alcanza pulsando algo sin texto no se encuentra. La ayuda se había quedado fuera.

Y SHALL estar en UN solo sitio del marco. Dejarla además en la cabecera sería un segundo destino
duplicado, y la única excepción declarada a eso es el perfil.

#### Scenario: Alguien busca la ayuda

- **WHEN** recorre la navegación de su perfil
- **THEN** encuentra la ayuda nombrada, como los demás destinos

#### Scenario: Se revisa el marco completo

- **WHEN** se enumeran los destinos que ofrece el marco de un rol
- **THEN** la ayuda aparece una sola vez
