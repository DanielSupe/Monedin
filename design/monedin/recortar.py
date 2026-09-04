"""
Trocea las láminas de la mascota en figuras sueltas con fondo transparente.

Se guarda versionado junto a las láminas para que volver a cortar con otro
criterio —otro margen, otro tamaño, una pieza que hoy se descarta— sea
ejecutarlo otra vez y no repetir el trabajo a mano.

    python design/monedin/recortar.py

Tres decisiones que conviene entender antes de tocarlo:

1. LA REJILLA SE DIVIDE, NO SE DETECTA. Se intentó detectarla proyectando los
   píxeles con contenido y buscando huecos, y no funciona: las estrellas, las
   flechas y los globos de una figura invaden el hueco que la separa de su
   vecina y hacen de puente, así que dos columnas salían como una. Ajustar el
   umbral hasta que cuadre da un número distinto en cada lámina — es un número
   mágico, y este proyecto los evita. Las láminas son rejillas regulares de tres
   columnas, así que se dividen en celdas iguales y dentro de cada una se recorta
   al contenido.

2. EL FONDO SE QUITA POR INUNDACIÓN DESDE EL BORDE, no por «todo lo que sea
   blanco». La moneda lleva destellos BLANCOS dentro, y los ojos también tienen
   blanco: un umbral sobre el color se los comería. Lo que es fondo es lo blanco
   que se toca con el borde de la celda; lo blanco encerrado dentro de la figura
   no.

3. LA TOLERANCIA NO ES CAPRICHO. Las láminas son JPG, así que el blanco no es
   blanco puro: la compresión deja los bordes sucios. Con un umbral estricto
   queda un halo gris alrededor de cada figura.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
ORIGEN = Path(__file__).resolve().parent
DESTINO = RAIZ / "apps/web/src/assets/tutorial"
CONTACTO = Path(__file__).resolve().parent / "contacto.png"

# Cuántas filas tiene cada lámina. Las columnas son tres en las tres.
COLUMNAS = 3
FILAS: dict[str, int] = {}  # se decide por el alto del contenido; ver `filas_de()`

# Un píxel es «casi blanco» si sus tres canales pasan de esto. Generoso a
# propósito: el JPG ensucia el blanco.
CASI_BLANCO = 233

# Margen alrededor de cada figura, para que ninguna quede a ras del borde.
MARGEN = 10

# El nombre de cada figura, en el orden en que salen de las láminas.
#
# Por lo que EXPRESAN y no por su posición: en el tutorial se lee qué se está
# poniendo, igual que el catálogo de animales de un avatar. Si el orden de las
# láminas cambiara, esta lista deja de casar — de ahí que se llamen `lamina-N`.
NOMBRES = [
    # lamina-1
    "senala-abajo",
    "senala-arriba",
    "avanza",
    "mira-el-saldo",
    "propone",
    "elige",
    # lamina-2
    "sorpresa",
    "llora",
    "bien-hecho",
    "duerme",
    "alcanza-la-meta",
    "enfado",
    "idea",
    "agobio",
    "corre",
    # lamina-3
    "saluda",
    "explica",
    "celebra",
    "pena",
    "presenta",
    "duda",
]


def casi_blanco(a: np.ndarray) -> np.ndarray:
    """Máscara de lo que PODRÍA ser fondo, por color."""
    return a.min(axis=2) >= CASI_BLANCO


def fondo_por_inundacion(claro: np.ndarray) -> np.ndarray:
    """
    Lo que es fondo DE VERDAD: lo casi blanco que se alcanza desde el borde.

    Sin esto, los destellos blancos de la moneda y el blanco de los ojos se
    volverían transparentes y la figura saldría agujereada.
    """
    alto, ancho = claro.shape
    fondo = np.zeros_like(claro, dtype=bool)
    cola: deque[tuple[int, int]] = deque()

    def sembrar(y: int, x: int) -> None:
        if claro[y, x] and not fondo[y, x]:
            fondo[y, x] = True
            cola.append((y, x))

    for x in range(ancho):
        sembrar(0, x)
        sembrar(alto - 1, x)
    for y in range(alto):
        sembrar(y, 0)
        sembrar(y, ancho - 1)

    while cola:
        y, x = cola.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < alto and 0 <= nx < ancho:
                sembrar(ny, nx)

    return fondo


def sin_lo_que_invade(figura: np.ndarray) -> np.ndarray:
    """
    Quita los trozos de la figura VECINA que se cuelan en esta celda.

    Las láminas no centran cada figura en su celda: una pierna o un globo de la
    de arriba entra por el borde. La primera regla que se probó fue «fuera todo
    lo que toque el borde», y se llevó por delante una figura ENTERA — hay una
    que desborda su celda de verdad, así que su propia moneda tocaba el borde.

    La que se queda no necesita ningún número que ajustar:

      - El grupo MÁS GRANDE de la celda es la figura. Siempre se queda, toque el
        borde o no.
      - Los demás se quedan si no tocan el borde: son sus adornos —estrellas,
        flechas, globos—, que están sueltos pero dentro.
      - Lo que toca el borde y no es el más grande viene de fuera.

    Se descartan GRUPOS y no píxeles: borrando solo el borde quedaría el resto
    del trozo flotando dentro de la imagen.
    """
    alto, ancho = figura.shape
    etiqueta = np.zeros_like(figura, dtype=np.int32)
    grupos: list[tuple[int, bool]] = []  # (tamaño, toca el borde)

    for y0 in range(alto):
        for x0 in range(ancho):
            if not figura[y0, x0] or etiqueta[y0, x0]:
                continue

            n = len(grupos) + 1
            cola = deque([(y0, x0)])
            etiqueta[y0, x0] = n
            tamano, toca = 0, False

            while cola:
                y, x = cola.popleft()
                tamano += 1
                if y in (0, alto - 1) or x in (0, ancho - 1):
                    toca = True
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < alto and 0 <= nx < ancho and figura[ny, nx] and not etiqueta[ny, nx]:
                        etiqueta[ny, nx] = n
                        cola.append((ny, nx))

            grupos.append((tamano, toca))

    if not grupos:
        return figura

    mayor = max(range(len(grupos)), key=lambda i: grupos[i][0]) + 1
    se_queda = np.array(
        [False] + [n == mayor or not toca for n, (_, toca) in enumerate(grupos, start=1)]
    )

    return se_queda[etiqueta]


def filas_de(a: np.ndarray) -> int:
    """
    Cuántas filas tiene la lámina, por la forma de sus celdas.

    Las figuras son aproximadamente cuadradas, así que se compara el alto que
    ocupa el contenido con el ancho de una columna: si da para tres altos de
    columna, son tres filas.
    """
    contenido = ~casi_blanco(a)
    filas_con_algo = np.where(contenido.any(axis=1))[0]
    alto = filas_con_algo[-1] - filas_con_algo[0] + 1
    return max(1, round(alto / (a.shape[1] / COLUMNAS)))


def recortar(lamina: Path) -> list[Image.Image]:
    im = Image.open(lamina).convert("RGB")
    a = np.asarray(im).astype(np.int16)
    filas = filas_de(a)

    alto_celda = im.height // filas
    ancho_celda = im.width // COLUMNAS
    piezas: list[Image.Image] = []

    for f in range(filas):
        for c in range(COLUMNAS):
            y0, x0 = f * alto_celda, c * ancho_celda
            celda = a[y0 : y0 + alto_celda, x0 : x0 + ancho_celda]

            fondo = fondo_por_inundacion(casi_blanco(celda))
            figura = sin_lo_que_invade(~fondo)
            if not figura.any():
                continue

            # Lo descartado vuelve a ser fondo, o saldría opaco en su sitio.
            fondo = ~figura

            ys, xs = np.where(figura)
            arriba = max(ys.min() - MARGEN, 0)
            abajo = min(ys.max() + 1 + MARGEN, celda.shape[0])
            izq = max(xs.min() - MARGEN, 0)
            der = min(xs.max() + 1 + MARGEN, celda.shape[1])

            rgb = celda[arriba:abajo, izq:der].astype(np.uint8)
            alfa = np.where(fondo[arriba:abajo, izq:der], 0, 255).astype(np.uint8)
            piezas.append(Image.fromarray(np.dstack([rgb, alfa])))

    return piezas


def contacto(piezas: list[Image.Image], columnas: int = 6) -> Image.Image:
    """Hoja numerada, para elegir sin abrir veintitantos archivos."""
    lado = 200
    filas = (len(piezas) + columnas - 1) // columnas
    hoja = Image.new("RGBA", (columnas * lado, filas * lado), (255, 255, 255, 255))

    for i, pieza in enumerate(piezas):
        copia = pieza.copy()
        copia.thumbnail((lado - 20, lado - 20))
        x = (i % columnas) * lado + (lado - copia.width) // 2
        y = (i // columnas) * lado + (lado - copia.height) // 2
        hoja.alpha_composite(copia, (x, y))

    return hoja


def main() -> None:
    DESTINO.mkdir(parents=True, exist_ok=True)
    # Se vacía: una pasada que saque MENOS piezas que la anterior dejaría las
    # sobrantes ahí, y nadie las distinguiría de las buenas.
    for viejo in DESTINO.glob("*.png"):
        viejo.unlink()
    todas: list[Image.Image] = []

    # `lamina-*` y no `*`: el contacto que este mismo script escribe vive en la
    # misma carpeta, y sin acotar entraba como si fuera una lámina más. Lo cazó
    # la comprobación de los nombres, que para eso está.
    laminas = sorted(ORIGEN.glob("lamina-*.jpg")) + sorted(ORIGEN.glob("lamina-*.png"))

    for lamina in laminas:
        piezas = recortar(lamina)
        print(f"{lamina.name}: {len(piezas)} figuras")
        todas.extend(piezas)

    if len(todas) != len(NOMBRES):
        raise SystemExit(
            f"salieron {len(todas)} figuras y hay {len(NOMBRES)} nombres. "
            "Si cambiaron las láminas, actualiza NOMBRES antes de seguir: "
            "guardarlas numeradas dejaría el tutorial apuntando a lo que no es."
        )

    for pieza, nombre in zip(todas, NOMBRES):
        pieza.save(DESTINO / f"{nombre}.png")

    contacto(todas).save(CONTACTO)
    print(f"\n{len(todas)} figuras en {DESTINO.relative_to(RAIZ)}")
    print(f"contacto en {CONTACTO.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
