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

- [x] 4.1 Volver a contar sobre la aplicación y ver que los pasos que dominan coinciden con los de la
      maqueta, en las tres escalas. **Destapó dos defectos**, que son las decisiones 4 y 5 del
      design: el recuento agrupaba por la carpeta del diseño en vez de por lo que la aplicación
      reasigna, y el camino de entrada no tenía escala propia.
- [x] 4.2 Abrir las pantallas más densas del padre —las dos bandejas y el catálogo— y confirmar que
      bajar el cuerpo no las rompe, que es el riesgo real de este cambio. **Comprobado** en las cinco
      —panel, las dos bandejas, el catálogo y los hijos— a 1440 y a 390, midiendo el ancho del
      documento contra el de la ventana: ni un desborde en ninguna. Y la escala del NIÑO destapó de
      paso lo suyo: su cuerpo pequeño eran 13 donde sus maquetas usan 14, así que bajó su micro a 12
      y subió su small a 14, y ahora sus tres pantallas dan los mismos pasos dominantes que ellas.
- [x] 4.3 Mirarlo en los dos temas. El peso se nota distinto sobre oscuro. **Comprobado** en las ocho
      compartidas: los tamaños y los pesos salen iguales en claro y en oscuro, y en la portada la
      paleta coincide hex a hex con su maqueta oscura. Lo que NO coincide es de color y no de escala:
      la rejilla y el teclado de PIN salen más monocromos que sus maquetas, que llevan violeta y
      ámbar en las tintas. Va en el repaso de color, pantalla por pantalla.
- [x] 4.4 `pnpm verify` entero. **13 de 13 tareas en verde**, con la batería del front en 583 tests.

## 5. Lo que la comprobación destapó

- [x] 5.1 Volver a contar la escala PÚBLICA sobre su única pantalla, elemento por elemento, y
      corregir los cuatro pasos que estaban un escalón por debajo.
- [x] 5.2 Declarar `[data-scale="entry"]` con los pasos contados en sus siete maquetas.
- [x] 5.3 Ponerlo en los DOS sitios que hacen falta: `EntryShell` para las que van dentro del marco,
      `AccessLayout` para las dos que van a sangre y no pasan por él.
- [x] 5.4 Reescribir el test que afirmaba «el marco de entrada no declara escala». Va por su tercera
      redacción y las tres veces por lo mismo: se escribía con la forma de la respuesta de entonces.
      Ahora afirma lo que no ha cambiado nunca —que no se cuela el marco de ninguno de los dos— y la
      escala propia se comprueba aparte, para que borrar el atributo no pase.
- [x] 5.5 Repartir los papeles que compartían un paso, con la tabla del design. Contradice el «no se
      toca ninguna pantalla» del proposal, y se dice en vez de disimularlo.
- [x] 5.6 Dar a `Button` la talla `keypad` y quitarle al teclado del PIN la clase que se la imponía.
      Funcionaba por el orden del CSS generado, que es justo lo que la cabecera de la pieza avisa.
- [x] 5.7 Corregir la línea de `CLAUDE.md` que decía que el marco de entrada no declara escala.
