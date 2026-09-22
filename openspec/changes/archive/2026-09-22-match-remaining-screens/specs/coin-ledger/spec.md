# coin-ledger

## ADDED Requirements

### Requirement: El historial de un hijo dice de quién es y cómo se corrige

La pantalla del historial de un hijo SHALL identificar al hijo —su nombre y su saldo— y NO SHALL
titularse solo por lo que muestra.

Se llega desde una lista de hijos, así que un título genérico deja sin contestar de quién es lo que
se está mirando. Y el saldo es además el número que trae a alguien hasta ahí.

La vista del ADULTO SHALL decir que el historial no se edita ni se borra, y cómo se corrige un
movimiento equivocado: registrando otro que lo compense.

Sin eso, una pantalla sin ninguna acción parece incompleta, y quien encuentra un error no tiene
salida. La vista del niño NO SHALL llevar esa nota: corregir no es cosa suya.

#### Scenario: Un adulto abre el historial de un hijo

- **WHEN** se muestra
- **THEN** dice de qué hijo es y cuál es su saldo
- **AND** dice que el historial no se borra y cómo se corrige

#### Scenario: Un niño abre el suyo

- **WHEN** se muestra
- **THEN** no habla de corregir movimientos
