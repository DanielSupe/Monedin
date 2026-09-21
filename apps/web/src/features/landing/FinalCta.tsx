import { Link } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { buttonClasses } from "../../ui/index.js";

/**
 * El cierre de la página.
 *
 * Antes no había: después de la última tarjeta, nada. La única llamada a la
 * acción estaba arriba, así que quien había leído la página entera tenía que
 * volver a subir para actuar — justo en el momento en que está más convencido.
 *
 * NO argumenta y NO pide datos. Quien llega aquí ya leyó los argumentos, y un
 * formulario en una página que no puede validar nada es una pantalla de acceso
 * disfrazada.
 *
 * Va en la superficie de la MARCA, que reasigna tinta, bordes y superficies
 * hacia dentro: la acción compone sola. Y no es un color nuevo — es el índigo
 * profundo del acceso, que es la otra pantalla que mira un adulto, así que la
 * página termina con el color al que lleva.
 */
export function FinalCta(): React.ReactElement {
  return (
    <section data-surface="brand" className="bg-brand text-ink">
      <div className="mx-auto flex w-full max-w-(--container-wide) flex-col items-start gap-4 px-4 py-12">
        <h2 className="text-display max-w-(--container-reading) font-extrabold">
          {messages.landing.closingTitle}
        </h2>
        <p className="text-body max-w-(--container-reading) text-ink-muted">
          {messages.landing.closingBody}
        </p>

        {/*
          `contrast` y no `primary`: sobre la superficie de la marca, el índigo
          de la acción principal se pelea con su propio fondo. La variante se
          nombra por el PAPEL —«destaca contra su superficie»— y aquí resuelve
          en ámbar, que además es lo que este producto entero enseña: dinero.
        */}
        {/*
          «Crear mi cuenta» y no «Empezar», que es lo que decían los otros dos.
          Al final de la página ya no hace falta invitar a empezar —eso lo hizo
          la cabecera y lo hizo el héroe— y lo que queda por decir es QUÉ va a
          pasar al pulsar. Tres botones iguales en una página también son tres
          oportunidades de no saber si llevan al mismo sitio.
        */}
        <Link
          to="/sign-up"
          className={buttonClasses("contrast", false, "large")}
        >
          {messages.landing.closingAction}
        </Link>
      </div>
    </section>
  );
}
