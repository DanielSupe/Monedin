import fs from "node:fs";
import { fileURLToPath } from "node:url";

const DIR = fileURLToPath(new URL("./pantallas/", import.meta.url));

/*
 * El modo oscuro NO invierte la pantalla: reasigna la capa semántica.
 *
 * Los tres acentos se quedan como están —naranja, morado y ámbar son la marca—
 * y lo que cambia son las superficies, la tinta y los fondos suaves. Es el mismo
 * mecanismo que el proyecto ya tiene previsto: un componente sigue pidiendo
 * «texto secundario» y lo que cambia es el VALOR de ese token.
 */
const MAPA = {
  // Superficies y tinta. El papel es tinta CÁLIDA, no negro: con negro puro el
  // naranja vibra y la marca pierde la calidez que la define.
  "#FFF7EC": "#1C1620",
  "#2A2438": "#F5F0EA",
  "#7A7590": "#A9A2B8",
  "#464154": "#CFC9DA",
  "#A08F86": "#9C9086",
  "#6B6053": "#C9BCAE",
  "#F0E6D8": "#332B40",
  "#EADFCF": "#3E3549",
  "#E3D6C4": "#453B52",
  "#F8F1E5": "#2E2739",
  "#F1E9DA": "#322B3C",
  "#F2EADC": "#3A3145",
  "#DCCDB6": "#4A3F58",
  "#F3E7D4": "#3A3145",
  "#E0CBAE": "#4A3F58",
  "#7A6449": "#C9BCAE",
  "#F3DCC7": "#4E4258",
  "#F3ECE0": "#3A3145",
  "#A09BB0": "#8F899E",
  "#9C97AD": "#7E788F",

  // Naranja: el acento se queda; lo que se invierte es su fondo suave.
  "#FFE9E2": "#3D2620",
  "#C7452A": "#FF9A7E",
  "#FFF1EC": "#33231D",
  "#FFF1E9": "#33231D",
  "#FFDCD1": "#4A2A20",
  "#FFB49C": "#6B3A28",
  "#FFD9CC": "#4A2A20",
  "#B23C22": "#FFB49C",
  "#B5533A": "#E58D72",
  "#EFC0AD": "#5C3A2E",
  "#F9E4DC": "#3A2620",

  // Morado: SE ACLARA. Sobre fondo oscuro el morado medio se hunde.
  "#6C4BD6": "#8B6BF0",
  "#7B5BE0": "#9B7CF5",
  "#5836BC": "#6B4BD0",
  "#8464E8": "#A78CF8",
  "#5A3CBE": "#B9A6F2",
  "#452B96": "#CBBCF7",
  "#EDE8FC": "#302847",
  "#F1ECFD": "#302847",
  "#EFE9FC": "#221C30",
  "#F1EDFD": "#221C30",
  "#DED5FA": "#443A63",
  "#E2DAFB": "#382D57",
  "#E0D8FB": "#382D57",
  "#B9A6F2": "#52407F",
  "#E4DDFA": "#2C2440",
  "#D6CBF6": "#2C2440",

  // Ámbar: la moneda no cambia. Solo su fondo suave y su tinta.
  "#FFF4DD": "#3D3220",
  "#FFF1DF": "#3A2E1C",
  "#B4791C": "#E8B45E",
  "#5C3B06": "#FFF4DD",
  "#F8D07A": "#3A2E18",
  "#C99527": "#5C4820",
  "#FBE2A8": "#3A2E18",
  "#E0B45E": "#5C4820",

  // Solo en las del padre y del niño.
  "#F6F3FE": "#2B2442",
  "#F3DEB0": "#4A3A1E",
  "#F2E7D5": "#3A3145",
  "#DFCDB2": "#4A3F58",
  "#94402A": "#E58D72",
  "#6B4A0C": "#F5C978",
  "#E2553A": "#FFB49C",

  // Las formas decorativas del fondo bajan a casi tocarlo.
  "#FFEDD9": "#241C2A",
  "#FFF3DE": "#241C2A",
  "#FFC9BB": "#3D2620",
};

// Lo que NO se toca: el ámbar de la moneda, el blanco de los textos sobre color
// y los colores propios de cada animal, que son suyos y no del tema.
const INTOCABLES = ["#F5B93B", "#E8A33C", "#FF6B4A", "#FF7C5A", "#F5533A", "#EE8B4A", "#FFE7D2", "#3A2A16", "#2F3446", "#A98A5E", "#FFF6E6", "#8E7047"];
for (const c of INTOCABLES) {
  if (MAPA[c]) throw new Error("intocable en el mapa: " + c);
}

/*
 * Lo que va ENCIMA del naranja no se aclara.
 *
 * El naranja es el mismo color en claro y en oscuro, así que su tinta oscura
 * —la que le da los 5,3:1— tiene que seguir siendo oscura. Si el cambio de tema
 * la aclarase, el botón volvería a los 2,8:1 justo en el tema donde peor se ve.
 */
function protegerTintaSobreNaranja(src) {
  const INICIO = /<(a|button|span)\s[^>]*background: #FF6B4A;[^>]*>/g;
  const cortes = [];
  for (const m of src.matchAll(INICIO)) {
    const tag = m[1];
    const fin = src.indexOf(`</${tag}>`, m.index + m[0].length);
    if (fin > 0) cortes.push([m.index, fin + tag.length + 3]);
  }
  let out = src;
  for (const [ini, fin] of cortes.reverse()) {
    const trozo = out.slice(ini, fin).split("#2A2438").join("@@TINTA@@");
    out = out.slice(0, ini) + trozo + out.slice(fin);
  }
  return out;
}

/*
 * El aviso va DENTRO del archivo, no solo en el README: quien abra una oscura
 * para editarla lo lee antes de escribir nada.
 */
const AVISO = [
  "",
  "  <!--",
  "    GENERADO por design/ui/a-oscuro.mjs a partir de su pareja en claro.",
  "    NO SE EDITA A MANO: se edita la clara, o se edita el mapa de color de",
  "    ese script. `node design/ui/a-oscuro.mjs --check` falla si se separan.",
  "  -->",
].join("\n");

function aOscuro(src) {
  let s = protegerTintaSobreNaranja(src).replace(
    '<meta charset="utf-8">',
    '<meta charset="utf-8">' + AVISO,
  );

  // El aro blanco que enmarca la cara del niño va SOBRE el panel naranja, así
  // que sigue siendo blanco: no es una superficie del tema, es un marco.
  s = s.split("width: 92px; height: 92px; border-radius: 50%; background: #FFFFFF; box-shadow: 0 8px 18px")
       .join("width: 92px; height: 92px; border-radius: 50%; background: @@ARO@@; box-shadow: 0 8px 18px");

  // Solo el blanco que hace de SUPERFICIE se oscurece. El de un texto o el de
  // la cara de un panda no es una superficie.
  s = s.split("background: #FFFFFF").join("background: @@SUPERFICIE@@");

  // Y la tinta ámbar se aclara, pero el trazo DENTRO de la moneda no: ese va
  // dibujado sobre el ámbar y tiene que seguir siendo oscuro.
  s = s.split("color: #8A5A10").join("color: @@AMBAR@@");

  s = s.replace(/#[0-9A-Fa-f]{6}/g, (m) => MAPA[m.toUpperCase()] ?? m);
  s = s.replace(/rgba\(42,36,56/g, "rgba(0,0,0");

  return s
    .split("@@ARO@@").join("#FFFFFF")
    .split("@@SUPERFICIE@@").join("#262031")
    .split("@@AMBAR@@").join("#F5C978")
    .split("@@TINTA@@").join("#2A2438");
}

const PANTALLAS = ["Perfiles", "Pin", "Main", "Tareas", "Premios", "Canjes", "Chat", "PadrePanel", "PadreTareas", "PadreCanjes", "PadrePremios", "PadreHijos", "PadreNuevaTarea", "Bienvenida", "Entrar", "Registro", "ResetPin", "NuevoPerfil", "Administrar", "ModalRetirar", "ModalBaja", "ModalRecorte", "NinoMonedas", "NinoPerfil", "NinoAyuda", "Recorrido", "PadreNuevoPremio", "PadreEditarHijo", "PadreHistorial", "PadreCuenta", "PadreAyuda", "PadreChat"];

/*
 * Las oscuras SE VERSIONAN, para que se abran con doble clic y para que un
 * cambio del mapa enseñe en la revisión a qué pantallas afecta. Y por eso mismo
 * hace falta esto: `--check` regenera en memoria y compara.
 *
 * Sin esa comprobación, «no edites una oscura a mano» sería una convención que
 * solo vive en un README, y de esas ya se sabe lo que dura.
 */
const COMPROBAR = process.argv.includes("--check");
const separadas = [];

for (const nombre of PANTALLAS) {
  const esperado = aOscuro(fs.readFileSync(DIR + nombre + ".dc.html", "utf8"));
  const destino = DIR + nombre + "Oscuro.dc.html";

  if (!COMPROBAR) {
    fs.writeFileSync(destino, esperado);
    continue;
  }
  const actual = fs.existsSync(destino) ? fs.readFileSync(destino, "utf8") : null;
  if (actual !== esperado) separadas.push(nombre + "Oscuro.dc.html");
}

if (COMPROBAR && separadas.length > 0) {
  console.error("Estas oscuras no son lo que el mapa produce:");
  for (const f of separadas) console.error("  " + f);
  console.error("\nSe arregla regenerándolas: node design/ui/a-oscuro.mjs");
  process.exit(1);
}

console.log(
  COMPROBAR
    ? PANTALLAS.length + " pantallas oscuras al día con sus claras"
    : PANTALLAS.length + " pantallas convertidas a oscuro",
);
