import { Link } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { Avatar, buttonClasses, cx } from "../../ui/index.js";
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
      <h2 className="text-title text-center font-bold">
        {manage ? messages.auth.manageProfilesTitle : messages.auth.whoIsPlaying}
      </h2>

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
                className={tileClasses}
              >
                <span className="relative">
                  <Avatar value={profile.avatar} size="xlarge" shape="rounded" />
                  {profile.familyRole === "PARENT" && <CrownBadge />}
                  {manage && <PencilBadge />}
                </span>
                <span className="text-body font-semibold">{profile.name}</span>
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
          <Link to="/profiles/new" className={tileClasses}>
            <span
              aria-hidden="true"
              // `size-36` es la misma medida que `Avatar size="xlarge"`: son la misma
              // fila, y una tesela más baja que las demás se lee como un error.
              className="rounded-card text-hero flex size-36 items-center justify-center bg-surface-sunken text-ink-muted leading-none"
            >
              +
            </span>
            <span className="text-body font-semibold">{messages.auth.createProfile}</span>
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
 * `p-2` y no `p-3`: con el avatar en 9rem, dos teselas y su hueco tienen que
 * caber en los 358 px útiles de una pantalla de 390. Medido, no deducido.
 *
 * El crecimiento va bajo `motion-safe`, y el realce de fondo NO. Bajo
 * movimiento reducido el sistema pone las duraciones a 1 ms, y eso convierte
 * este crecimiento en un salto instantáneo — que es peor para quien pidió no
 * ver movimiento, no mejor. Así, con movimiento reducido la tesela sigue
 * respondiendo por color y no se mueve. Ver la decisión 3 del design.
 */
const tileClasses =
  "rounded-card flex w-40 flex-col items-center gap-2 p-2 text-center no-underline text-ink transition duration-normal hover:bg-surface-sunken motion-safe:hover:scale-105";

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
    <span className={cx(tileClasses, "opacity-55")}>
      <Avatar value={avatar} size="xlarge" shape="rounded" />
      <span className="text-body font-semibold">{name}</span>
      <span className="text-small text-ink-muted">{messages.auth.profileLocked}</span>
    </span>
  );
}

/** El lápiz del modo administrar. Decorativo: lo que se anuncia es la tesela. */
function PencilBadge(): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      // Mismo velo que el diálogo, que es el precedente del sistema.
      className="rounded-card absolute inset-0 flex items-center justify-center bg-ink/40 text-ink-inverted"
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
