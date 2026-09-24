import { Link } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { Avatar, Badge, HeroPanel, Mascota, buttonClasses, cx } from "../../ui/index.js";
import { useProfiles } from "./use-session.js";

export function ProfileGrid({ manage = false }: { manage?: boolean }): React.ReactElement {
  const { data, isPending } = useProfiles(true);

  if (isPending) {
    return <p className="text-body text-ink-muted">{messages.health.loading}</p>;
  }

  const profiles = data?.profiles ?? [];

  return (
    <section className="flex w-full max-w-(--container-wide) flex-col items-center gap-8">

      <HeroPanel className="w-full max-w-reading" mascot={<Mascota pose="saluda" size="medium" />}>
        <h2 className="text-hero font-extrabold text-ink-inverted">
          {manage ? messages.auth.manageProfilesTitle : messages.auth.whoIsPlaying}
        </h2>

        <p className="text-lead text-ink-inverted opacity-90">
          {manage ? messages.auth.manageProfilesLead : messages.auth.whoIsPlayingLead}
        </p>
      </HeroPanel>

      <ul className="flex list-none flex-wrap justify-center gap-6 p-0">
        {profiles.map((profile) => (
          <li key={profile.id} className="flex">
            {profile.locked ? (
              <LockedTile name={profile.name} avatar={profile.avatar} />
            ) : (
              <Link
                to="/profiles/$profileId/pin"
                params={{ profileId: profile.id }}
                search={{ manage: manage || undefined }}

                aria-label={manage ? `${messages.auth.editProfile} ${profile.name}` : undefined}
                className={tileClasses(profile.familyRole === "PARENT" ? "brand" : "primary")}
              >
                <span className="relative">
                  <Avatar value={profile.avatar} size="xlarge" />
                  {profile.familyRole === "PARENT" && <CrownBadge />}
                  {manage && <PencilBadge />}
                </span>

                <span className="text-title px-2 font-semibold">{profile.name}</span>
              </Link>
            )}
          </li>
        ))}

        <li className="flex">

          <Link
            to="/profiles/new"

            className={cx(tileClasses("muted"), "border-dashed hover:bg-surface-sunken")}
          >
            <span
              aria-hidden="true"

              className="rounded-pill text-hero flex size-28 items-center justify-center bg-surface-sunken text-primary leading-none"
            >
              +
            </span>
            <span className="text-lead px-2 font-semibold">{messages.auth.createProfile}</span>
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

function tileClasses(tono: "brand" | "primary" | "muted"): string {
  return cx(
    "rounded-card flex min-h-52 w-36 flex-col items-center justify-start gap-3 border-2 bg-surface-raised px-0 py-5 text-center no-underline text-ink shadow-card transition duration-normal sm:w-44",
    tono === "brand" && "border-brand",
    tono === "primary" && "border-primary",
    tono === "muted" && "border-border",
    tono !== "muted" && "hover:bg-surface-sunken motion-safe:hover:scale-105",
  );
}

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
      <span className="text-title px-2 font-semibold">{name}</span>

      <Badge tone="conflict">{messages.auth.profileLocked}</Badge>
    </span>
  );
}

function PencilBadge(): React.ReactElement {
  return (
    <span
      aria-hidden="true"

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
