/**
 * Contrato del almacén de archivos.
 *
 * ÚNICA forma en que el resto del proyecto habla con S3. Está aquí, y no dentro
 * de un módulo, para que ningún módulo de dominio importe el SDK: el mismo
 * argumento por el que solo los repositorios importan el cliente de la base de
 * datos.
 *
 * Lo que este archivo NO sabe, y no debe saber: qué es un hijo, un premio o una
 * tarea; quién puede subir qué; ni de dónde salió la clave que recibe. Recibe
 * una clave ya decidida y firma, igual que `applyCoinMovement` recibe una
 * transacción y no la abre. Quién es dueño de qué lo comprueba el servicio del
 * módulo, con el actor, ANTES de llamar aquí. Ver la decisión 2 del design de
 * `add-file-storage`.
 */
export interface StorageProvider {
  /**
   * Una URL contra la que subir un archivo directamente, sin pasar por la API.
   *
   * La firma queda atada al tipo de contenido: subir con otro distinto lo
   * rechaza el propio almacén, no la aplicación. Es lo que hace que la
   * restricción de tipos no dependa de que nadie se salte una validación.
   */
  createUploadUrl(params: {
    key: string;
    contentType: string;
  }): Promise<{ uploadUrl: string; expiresAt: Date }>;

  /** Una URL con la que leer un objeto privado, para incrustarla en una respuesta. */
  createReadUrl(key: string): Promise<string>;

  /** Si el objeto está de verdad en el almacén. Lo usa quien va a guardar su clave. */
  objectExists(key: string): Promise<boolean>;
}

/**
 * Cuánto vive una URL de subida.
 *
 * Cinco minutos es una ventana de trabajo —elegir la foto, recortarla,
 * subirla—, no algo que se guarda. Si caduca, se pide otra: no hay nada que
 * recuperar.
 */
export const UPLOAD_URL_TTL_SECONDS = 300;

/**
 * Cuánto vive una URL de lectura.
 *
 * Una hora, porque estas URLs viajan DENTRO de las respuestas JSON y una
 * pestaña abierta seguiría mostrando la página mucho después de haberla
 * pedido: con un minuto, las imágenes se romperían solas sin que nadie tocara
 * nada.
 *
 * Los dos son constantes y no configuración a conciencia: no son un parámetro
 * que cambie entre despliegues, así que si alguno resulta equivocado lo que hay
 * que cambiar es el número, no la forma de configurarlo. Ver la decisión 9 del
 * design.
 */
export const READ_URL_TTL_SECONDS = 3600;
