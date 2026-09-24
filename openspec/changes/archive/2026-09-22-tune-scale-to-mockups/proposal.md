# Afinar la escala y el peso a lo que las maquetas usan

## Why

Al comparar la aplicación con las maquetas pantalla por pantalla aparece una
diferencia que no es de ninguna pantalla: **la escala está inflada y el texto
pesa la mitad**.

Medido sobre los 32 artboards, contando cada declaración:

| | la maqueta usa | el token pone |
| --- | --- | --- |
| Niño, cuerpo | 14px (80) y 15px (72) | 17px |
| Niño, título | 21px | 26px |
| Niño, display | 26px | 34px |
| Público, cuerpo | 15px (33) y 16px (31) | 18px |
| Público, título | 22–24px | 30px |

Y el peso, que es lo más visible de todo: en las 32 maquetas hay **900 en 545
declaraciones, 800 en 339 y 700 en 266. Ni un solo 400.** La aplicación pinta
casi todo su texto en 400 y su énfasis en 600.

El resultado es que cada pantalla se ve a la vez más grande y más floja que su
maqueta, y eso no se arregla pantalla por pantalla: son dos valores del sistema.

## What Changes

- **Las tres escalas se reajustan** a las cifras que las maquetas usan de verdad,
  paso por paso.
- **El registro tipográfico sube.** El vocabulario de pesos de Tailwind se
  redefine en la capa de tokens para que apunte al registro del diseño: lo que
  una pieza pide como «normal» son 700, y lo que pide como «bold» son 900. No se
  toca ni una clase en ninguna pieza.
- **El `--text-hero` del niño se queda donde está**, porque no lo manda la
  maqueta sino un requisito vigente: el saldo es el elemento más grande de su
  inicio.

## Impact

- `apps/web/src/styles/tokens.css` y nada más. Es exactamente lo que la regla del
  origen único compra: dos bloques de valores mueven las treinta y dos pantallas.
- Ninguna pieza cambia, ninguna pantalla cambia, ningún test de estructura
  cambia.

## No incluye

- **Las diferencias de ESTRUCTURA**, que las hay y son otra conversación: el
  inicio del niño es de dos columnas en la maqueta y de una en la aplicación, le
  falta el bloque de «Tus monedas», y las filas de tarea no llevan su botón. Eso
  va pantalla por pantalla, después de esto.
- **El saldo como píldora en la cabecera.** La maqueta lo pone ahí y un requisito
  vigente dice que es el elemento más grande del inicio. Es una decisión de
  producto y se decide aparte, no de pasada en un ajuste de escala.
