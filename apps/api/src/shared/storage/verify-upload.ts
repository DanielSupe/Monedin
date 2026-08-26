import type { StorageProvider } from "./provider.js";

/**
 * Si una clave que alguien confirma se puede guardar de verdad.
 *
 * Son DOS comprobaciones y hacen falta las dos:
 *
 *   1. Que la clave empiece por el prefijo del dueño. Sin esto, quien vio la
 *      clave de otro recurso en una respuesta podría confirmarla como suya.
 *   2. Que el objeto exista. Sin esto, se guardaría una referencia rota —el
 *      `PUT` pudo no llegar nunca— y el front pediría una URL de algo que no
 *      está.
 *
 * Están juntas aquí, y no copiadas en los cuatro módulos, precisamente porque
 * olvidar cualquiera de las dos es un agujero y no un descuido cosmético: una
 * deja pasar referencias rotas, la otra deja apuntar a la foto de otro.
 *
 * Lo que sigue decidiendo cada módulo es el PREFIJO —qué es ser dueño de esto—,
 * que es su política y no la de este archivo. Ver la decisión 3 del design de
 * `add-file-storage`.
 */
export async function isConfirmableUpload(
  storage: StorageProvider,
  key: string,
  expectedPrefix: string,
): Promise<boolean> {
  if (!key.startsWith(expectedPrefix)) return false;

  // Las claves de S3 son literales y el motor no resuelve `..`, así que una con
  // travesía apuntaría a un objeto que nadie escribió y `objectExists` diría que
  // no. Se rechaza igualmente y antes: que la defensa no dependa de razonar
  // sobre cómo interpreta las rutas un almacén que puede cambiar.
  if (key.includes("..")) return false;

  return storage.objectExists(key);
}
