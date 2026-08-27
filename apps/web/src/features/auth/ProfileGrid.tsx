import { Link } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { Avatar } from "../../ui/Avatar.js";
import { useProfiles } from "./use-session.js";

/**
 * Rejilla de perfiles. Se ve con cuenta acreditada y sin perfil elegido
 * (decisión 7 del design de `add-profile-selection`).
 *
 * Desde `add-app-shell` es solo la rejilla: el teclado de PIN, el alta de un
 * hijo y el restablecimiento del PIN de adulto son destinos propios y ya no
 * vistas de este componente.
 */
export function ProfileGrid(): React.ReactElement {
  const { data, isPending } = useProfiles(true);

  if (isPending) {
    return <p>{messages.health.loading}</p>;
  }

  const profiles = data?.profiles ?? [];

  return (
    <section>
      <h2>{messages.auth.whoIsPlaying}</h2>

      <ul style={{ display: "flex", gap: "1rem", listStyle: "none", padding: 0, flexWrap: "wrap" }}>
        {profiles.map((profile) => (
          <li key={profile.id}>
            {/*
              Un perfil bloqueado no es un enlace: sin destino al que llevar, un
              enlace deshabilitado no existe en HTML y un botón muerto confunde
              menos que un enlace que no navega.
            */}
            {profile.locked ? (
              <span
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "1rem 1.5rem",
                  fontSize: "1.1rem",
                  opacity: 0.55,
                }}
              >
                <Avatar value={profile.avatar} size="medium" />
                <span>
                  {profile.name} ({messages.auth.profileLocked})
                </span>
              </span>
            ) : (
              <Link
                to="/profiles/$profileId/pin"
                params={{ profileId: profile.id }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "1rem 1.5rem",
                  fontSize: "1.1rem",
                }}
              >
                <Avatar value={profile.avatar} size="medium" />
                <span>{profile.name}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>

      <p style={{ marginTop: "1rem" }}>
        <Link to="/profiles/new">{messages.auth.createProfile}</Link>
      </p>
    </section>
  );
}
