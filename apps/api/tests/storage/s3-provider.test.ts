import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isConfirmableUpload } from "../../src/shared/storage/index.js";
import { existeObjeto, sembrarObjeto, subirConUrlFirmada, testStorageProvider } from "../support/storage.js";

/**
 * El almacén, contra MinIO de verdad.
 *
 * Lo que se prueba aquí no lo probaría un doble: que una firma atada a un tipo
 * de contenido RECHAZA otro, y que preguntar por algo que no está responde que
 * no está en vez de reventar. Ver la decisión 8 del design.
 */

const storage = testStorageProvider();

function claveDePrueba(extra = ""): string {
  return `tests/${randomUUID()}${extra}.jpg`;
}

describe("subir con una URL firmada", () => {
  it("lo que se sube con la URL queda guardado", async () => {
    const key = claveDePrueba();

    const { uploadUrl } = await storage.createUploadUrl({ key, contentType: "image/jpeg" });
    const response = await subirConUrlFirmada(uploadUrl);

    expect(response.ok).toBe(true);
    expect(await existeObjeto(key)).toBe(true);
  });

  it("la URL dice cuándo caduca, y es en el futuro", async () => {
    const { expiresAt } = await storage.createUploadUrl({
      key: claveDePrueba(),
      contentType: "image/jpeg",
    });

    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("subir con un tipo distinto del firmado lo rechaza el ALMACÉN", async () => {
    // Es la garantía que no depende de que nadie se salte una validación: el
    // tipo va dentro de la firma, así que cambiarlo la invalida.
    const key = claveDePrueba();

    const { uploadUrl } = await storage.createUploadUrl({ key, contentType: "image/jpeg" });
    const response = await subirConUrlFirmada(uploadUrl, "image/png");

    expect(response.ok).toBe(false);
    expect(await existeObjeto(key)).toBe(false);
  });

  it("dos subidas seguidas del mismo recurso no comparten clave", async () => {
    const primera = await storage.createUploadUrl({
      key: claveDePrueba("-a"),
      contentType: "image/jpeg",
    });
    const segunda = await storage.createUploadUrl({
      key: claveDePrueba("-b"),
      contentType: "image/jpeg",
    });

    expect(primera.uploadUrl).not.toBe(segunda.uploadUrl);
  });
});

describe("leer lo guardado", () => {
  it("la URL de lectura sirve para recuperar el contenido", async () => {
    const key = claveDePrueba();
    await sembrarObjeto(key, "image/jpeg", "contenido-conocido");

    const readUrl = await storage.createReadUrl(key);
    const response = await fetch(readUrl);

    expect(response.ok).toBe(true);
    expect(await response.text()).toBe("contenido-conocido");
  });

  it("el bucket es privado: sin firma no se lee", async () => {
    const key = claveDePrueba();
    await sembrarObjeto(key);

    const readUrl = await storage.createReadUrl(key);
    // La misma dirección sin los parámetros de la firma.
    const sinFirma = readUrl.split("?")[0] ?? readUrl;

    const response = await fetch(sinFirma);

    expect(response.ok).toBe(false);
  });
});

describe("preguntar si algo está", () => {
  it("dice que sí sobre lo que se subió", async () => {
    const key = claveDePrueba();
    await sembrarObjeto(key);

    expect(await storage.objectExists(key)).toBe(true);
  });

  it("dice que NO sobre una clave inventada, en vez de reventar", async () => {
    // Quien pregunta lo hace justo para decidir: un error aquí convertiría «no
    // subiste la foto» en un 500.
    expect(await storage.objectExists(claveDePrueba("-jamas-subida"))).toBe(false);
  });
});

describe("las dos comprobaciones antes de guardar una clave", () => {
  it("acepta una clave del prefijo correcto que además existe", async () => {
    const prefix = `tests/${randomUUID()}/`;
    const key = `${prefix}foto.jpg`;
    await sembrarObjeto(key);

    expect(await isConfirmableUpload(storage, key, prefix)).toBe(true);
  });

  it("rechaza una clave que existe pero es de OTRO prefijo", async () => {
    // Sin esta comprobación, quien vio la clave de otro recurso en una respuesta
    // podría confirmarla como suya.
    const ajena = `tests/${randomUUID()}/foto.jpg`;
    await sembrarObjeto(ajena);

    expect(await isConfirmableUpload(storage, ajena, `tests/${randomUUID()}/`)).toBe(false);
  });

  it("rechaza una clave del prefijo correcto que nunca se subió", async () => {
    // Sin esta, se guardaría una referencia rota y el front pediría una URL de
    // algo que no está.
    const prefix = `tests/${randomUUID()}/`;

    expect(await isConfirmableUpload(storage, `${prefix}fantasma.jpg`, prefix)).toBe(false);
  });

  it("rechaza una clave con travesía de directorios", async () => {
    const prefix = `tests/${randomUUID()}/`;

    expect(await isConfirmableUpload(storage, `${prefix}../otro/foto.jpg`, prefix)).toBe(false);
  });
});
