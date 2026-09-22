import { Link } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { Avatar, Badge, HeroPanel, Mascota, buttonClasses, cx } from "../../ui/index.js";
import { useProfiles } from "./use-session.js";

/**
 * Rejilla de perfiles. Se ve con cuenta acreditada y sin perfil elegido
 * (decisión 7 del design de `add-profile-selection`).
 *
 * Desde `add-app-shell` es solo la rejilla: el teclado de PIN, el alta de un
 * hijo y el restablecimiento del PIN de adulto son destinos propios y ya no
 * vistas de este componente.
 *
 * Desde `redesign-profile-grid` tiene un modo de ADMINISTRACIÓN, que llega en la
 * dirección y no en un estado local. Ver la decisión 1 de su design: lo que
 * decide es que la intención sobreviva al viaje al teclado de PIN, porque
 * después de acertarlo quien navega es la guarda y no este componente.
 */
export function ProfileGrid({ manage = false }: { manage?: boolean }): React.ReactElement {
  const { data, isPending } = useProfiles(true);

  if (isPending) {
    return <p className="text-body text-ink-muted">{messages.health.loading}</p>;
  }

  const profiles = data?.profiles ?? [];

  return (
    <section className="flex w-full max-w-(--container-wide) flex-col items-center gap-8">
      {/*
        LA PREGUNTA VA EN UN PANEL DE MARCA Y CON MONEDÍN, no como un titular
        suelto sobre el fondo.

        Es la pantalla por la que se pasa cada vez que alguien coge la tablet, y
        era la más sosa del producto: un texto negro centrado y cinco huecos
        grises. La maqueta la abre con Monedín preguntando desde el color de la
        acción, que es exactamente lo que esta pantalla pide — hay que elegir.
      */}
      <HeroPanel className="w-full max-w-reading" mascot={<Mascota pose="saluda" size="medium" />}>
        <h2 className="text-hero font-extrabold text-ink-inverted">
          {manage ? messages.auth.manageProfilesTitle : messages.auth.whoIsPlaying}
        </h2>

        {/*
          El modo se anuncia con una FRASE, no solo con el lápiz de cada tesela.
          Lo que cambió es el modo y no cada perfil, y enterarse mirando un
          distintivo pequeño en doce sitios es el trabajo que esta línea ahorra.

          Y la rejilla normal lleva la suya, que faltaba: el título pregunta
          quién eres y no dice que después hay un PIN. La línea no era «el
          adorno del modo administrar», era la de las dos.
        */}
        <p className="text-lead text-ink-inverted opacity-90">
          {manage ? messages.auth.manageProfilesLead : messages.auth.whoIsPlayingLead}
        </p>
      </HeroPanel>

      <ul className="flex list-none flex-wrap justify-center gap-6 p-0">
        {profiles.map((profile) => (
          <li key={profile.id}>
            {profile.locked ? (
              <LockedTile name={profile.name} avatar={profile.avatar} />
            ) : (
              <Link
                to="/profiles/$profileId/pin"
                params={{ profileId: profile.id }}
                search={{ manage: manage || undefined }}
                /*
                 * Un solo elemento interactivo por tesela. El lápiz va DENTRO y
                 * es decorativo: dos objetivos de toque solapados fallan justo
                 * donde el dedo de un niño ya falla, y con teclado serían dos
                 * paradas para una sola cosa. Ver la decisión 3 del design.
                 */
                aria-label={manage ? `${messages.auth.editProfile} ${profile.name}` : undefined}
                className={tileClasses(profile.familyRole === "PARENT" ? "brand" : "primary")}
              >
                <span className="relative">
                  <Avatar value={profile.avatar} size="xlarge" />
                  {profile.familyRole === "PARENT" && <CrownBadge />}
                  {manage && <PencilBadge />}
                </span>
                <span className="text-title font-semibold">{profile.name}</span>
              </Link>
            )}
          </li>
        ))}

        <li>
          {/*
            «Agregar perfil» es una tesela más y no un enlace de texto debajo:
            crear el primer hijo es lo que hace que el producto haga algo, y
            enterrarlo bajo la rejilla lo escondía.
          */}
          <Link
            to="/profiles/new"
            /*
              DE TRAZO DISCONTINUO, como en la maqueta: no es un perfil, es el
              hueco donde cabría uno. Con el mismo borde que los demás se lee
              como una quinta cara.
            */
            className={cx(tileClasses("muted"), "border-dashed hover:bg-surface-sunken")}
          >
            <span
              aria-hidden="true"
              // `size-36` es la misma medida que `Avatar size="xlarge"`: son la misma
              // fila, y una tesela más baja que las demás se lee como un error.
              // Un círculo, como los avatares que acompaña: la fila es de caras
              // redondas y un cuadrado en medio rompe la lectura.
              className="rounded-pill text-hero flex size-36 items-center justify-center bg-surface-sunken text-primary leading-none"
            >
              +
            </span>
            <span className="text-lead font-semibold">{messages.auth.createProfile}</span>
          </Link>
        </li>
      </ul>

      <Link
        to="/profiles"
        search={{ manage: manage ? undefined : true }}
        className={buttonClasses(manage ? "primary" : "secondary")}
      >
        {manage ? messages.auth.manageDone : messages.auth.manageProfiles}
      </Link>
    </section>
  );
}

/*
 * La caja de una tesela. Misma forma para un perfil y para «agregar».
 *
 * `w-36` y sin relleno lateral: la tesela mide EXACTAMENTE lo que el avatar.
 *
 * Se midió mal la primera vez. Con `w-40` hacían falta 344 px para dos teselas
 * y su hueco, y en una pantalla de 390 hay 343 en cuanto aparece la barra de
 * desplazamiento — que aparece justo cuando hay perfiles de sobra—. Fallaba por
 * UN píxel, y al caer a una columna la página se alargaba y la barra se quedaba:
 * un bucle. Ahora hacen falta 312, con 31 de holgura.
 *
 * El crecimiento va bajo `motion-safe`, y el realce de fondo NO. Bajo
 * movimiento reducido el sistema pone las duraciones a 1 ms, y eso convierte
 * este crecimiento en un salto instantáneo — que es peor para quien pidió no
 * ver movimiento, no mejor. Así, con movimiento reducido la tesela sigue
 * respondiendo por color y no se mueve. Ver la decisión 3 del design.
 */
/**
 * UNA TESELA ES UNA TARJETA CON SU BORDE, y antes era un hueco sin nada.
 *
 * Comparada con su maqueta, la rejilla salía plana: cinco rectángulos del mismo
 * gris sobre el mismo fondo, sin borde, sin tarjeta y sin nada que separara a un
 * perfil del siguiente. Es la pantalla que más se mira de todo el producto —se
 * pasa por ella cada vez que alguien coge la tablet— y era la más sosa.
 *
 * EL COLOR DEL BORDE SIGUE UNA REGLA y no un reparto: violeta para el adulto,
 * coral para los hijos. Son los dos tonos de la paleta con su significado
 * puesto —el violeta de lo guardado y lo adulto, el coral de quien hace—, así
 * que la rejilla se lee de un vistazo sin tener que aprenderse nada. La maqueta
 * alterna los dos entre los hijos; alternar es una decisión que hay que volver a
 * tomar cada vez que se añade uno, y esto no.
 */
function tileClasses(tono: "brand" | "primary" | "muted"): string {
  return cx(
    "rounded-card flex h-60 w-36 flex-col items-center justify-start gap-2 border-2 bg-surface-raised px-0 py-3 text-center no-underline text-ink shadow-card transition duration-normal",
    tono === "brand" && "border-brand",
    tono === "primary" && "border-primary",
    tono === "muted" && "border-border",
    tono !== "muted" && "hover:bg-surface-sunken motion-safe:hover:scale-105",
  );
}

/**
 * Un perfil bloqueado NO es un enlace y NO lleva lápiz.
 *
 * Sin destino al que llevar, un enlace deshabilitado no existe en HTML y un
 * botón muerto confunde menos que un enlace que no navega. Y ofrecer editarlo
 * sería ofrecer algo que el sistema va a rechazar: sin PIN no se entra, y sin
 * entrar no se edita.
 */
function LockedTile({
  name,
  avatar,
}: {
  name: string;
  avatar: string | null;
}): React.ReactElement {
  return (
    <span className={cx(tileClasses("muted"), "opacity-70")}>
      <Avatar value={avatar} size="xlarge" />
      <span className="text-title font-semibold">{name}</span>
      {/* Una INSIGNIA y no letra gris: es un estado, y el producto los dibuja
          así en todas partes. En gris se leía como parte del nombre. */}
      <Badge tone="conflict">{messages.auth.profileLocked}</Badge>
    </span>
  );
}

/** El lápiz del modo administrar. Decorativo: lo que se anuncia es la tesela. */
function PencilBadge(): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      /*
        Mismo velo que el diálogo, que es el precedente del sistema.

        REDONDO, y eso cambió con el avatar: mientras fue un cuadrado redondeado
        el velo llevaba su mismo radio, y al pasar la cara a círculo se quedó con
        cuatro esquinas asomando por fuera. Un velo que cubre algo tiene que
        tener su forma, no la que tenía antes.
      */
      className="rounded-pill absolute inset-0 flex items-center justify-center bg-ink/40 text-ink-inverted"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-10">
        <path
          d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/**
 * La corona del adulto.
 *
 * NO es decorativa: lleva nombre. Un icono suelto hay que aprenderlo, y quien
 * no ve la pantalla no lo aprende nunca, así que la distinción existe en los
 * dos canales o no existe. Va en la esquina y no bajo el nombre para que todas
 * las teselas queden a la misma altura.
 */
function CrownBadge(): React.ReactElement {
  return (
    <span
      role="img"
      aria-label={messages.auth.adultProfile}
      className="rounded-control absolute -top-1 -right-1 flex size-8 items-center justify-center border border-border bg-surface-raised text-coin-ink shadow-card"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-5">
        <path
          d="M3 8l4 3 5-6 5 6 4-3-2 11H5L3 8Z"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
