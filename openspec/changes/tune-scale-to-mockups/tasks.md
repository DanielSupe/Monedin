# Tareas

## 1. Medir antes de tocar

- [x] 1.1 Contar tamaños, pesos y radios de los 32 artboards, agrupados como los agrupa el lienzo
      —compartidas, padre, niño—. Sin esto, «se ve distinto» no es accionable.
- [x] 1.2 Contar lo mismo sobre la aplicación en marcha, pantalla a pantalla, y quedarse con la
      diferencia. Es lo que separa un defecto del sistema de uno de una pantalla.

## 2. La escala

- [x] 2.1 Ajustar los pasos de la escala del NIÑO: su cuerpo son 15px y no 17, su título 21 y no 26,
      su display 26 y no 34.
- [x] 2.2 Ajustar los del PADRE, que es la que menos se mueve: cuerpo 14 y no 15, título 19 y no 21.
- [x] 2.3 Ajustar los de la PÚBLICA: cuerpo 16 y no 18, título 24 y no 30.
- [x] 2.4 Dejar el `--text-hero` del niño donde está, y decir por qué: lo manda un requisito vigente
      —el saldo es el elemento más grande de su inicio— y no la maqueta.

## 3. El peso

- [x] 3.1 Redefinir el vocabulario de pesos en la capa de tokens al registro del diseño: lo normal son
      700, el énfasis 800, los titulares 900. En las 32 maquetas no hay ni una declaración de 400.
- [x] 3.2 Escribirlo con todas las letras en `tokens.css`: en este proyecto `font-normal` no son 400.
      Una palabra que significa otra cosa sin avisar es peor que un valor raro.
- [x] 3.3 No tocar ni una clase en ninguna pieza. Si hace falta tocar una, el arreglo está en la capa
      equivocada.

## 4. Comprobar

- [ ] 4.1 Volver a contar sobre la aplicación y ver que los pasos que dominan coinciden con los de la
      maqueta, en las tres escalas.
- [ ] 4.2 Abrir las pantallas más densas del padre —las dos bandejas y el catálogo— y confirmar que
      bajar el cuerpo no las rompe, que es el riesgo real de este cambio.
- [ ] 4.3 Mirarlo en los dos temas. El peso se nota distinto sobre oscuro.
- [ ] 4.4 `pnpm verify` entero.
