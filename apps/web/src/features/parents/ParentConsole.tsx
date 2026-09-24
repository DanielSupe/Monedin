import { Link } from "@tanstack/react-router";
import type { Child } from "@monedin/contracts";
import { messages } from "../../lib/messages.js";
import { useSession } from "../auth/use-session.js";
import { Tutorial } from "../tutorial/Tutorial.js";
import { PARENT_STEPS } from "../tutorial/steps.js";
import {
  Alert,
  Avatar,
  Card,
  Coins,
  HeroPanel,
  IconTile,
  Skeleton,
  buttonClasses,
} from "../../ui/index.js";
import type { HeroTone } from "../../ui/index.js";
import { LeaveProfile } from "../auth/LeaveProfile.js";
import { useParentConsole, type Recuento } from "./use-parent-console.js";

export function ParentConsole({ name }: { name: string }): React.ReactElement {
  const actor = useSession().session?.actor;
  const { tasksToApprove, redemptionsWaiting, children, isPending, error } = useParentConsole();

  if (isPending) {
    return <Skeleton lines={5} />;
  }

  if (error != null) {
    return <Alert tone="danger">{messages.parents.consoleFailed}</Alert>;
  }

  const sinNada = tasksToApprove.value === 0 && redemptionsWaiting.value === 0;

  return (
    <section className="flex flex-col gap-6">

      {actor?.tutorialSeen === false && <Tutorial steps={PARENT_STEPS} />}

      <h2 className="text-display font-extrabold">
        {messages.parents.greeting} {name}
      </h2>

      <section data-tutorial="parent-pending" className="flex flex-col gap-3">
        <h3 className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
          {messages.parents.pendingTitle}
        </h3>

        {sinNada ? (
          <Card>
            <p className="text-body text-ink-muted">{messages.parents.allClear}</p>
          </Card>
        ) : (
          <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
            {tasksToApprove.value > 0 && (
              <li>
                <PendingLink
                  to="/tasks"
                  search={{ page: 1, status: "COMPLETED" }}
                  tone="action"
                  icon={<IconoTareas />}
                  count={tasksToApprove}
                  one={messages.parents.taskToApprove}
                  many={messages.parents.tasksToApprove}
                />
              </li>
            )}

            {redemptionsWaiting.value > 0 && (
              <li>
                <PendingLink
                  to="/redemptions"
                  search={{ page: 1, status: "PENDING" }}
                  tone="saving"
                  icon={<IconoCanjes />}
                  count={redemptionsWaiting}
                  one={messages.parents.redemptionWaiting}
                  many={messages.parents.redemptionsWaiting}
                />
              </li>
            )}
          </ul>
        )}
      </section>

      <section data-tutorial="parent-children" className="flex flex-col gap-3">
        <h3 className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
          {messages.parents.childrenTitle}
        </h3>

        <Card>
          {children.length === 0 ? (
            <p className="text-body text-ink-muted">{messages.parents.childrenEmpty}</p>
          ) : (
            <ul className="flex list-none flex-col gap-3 p-0">
              {children.map((hijo) => (
                <ChildBalance key={hijo.id} child={hijo} />
              ))}
            </ul>
          )}
        </Card>

        <Link
          to="/children"
          search={{ page: 1 }}
          className={`${buttonClasses("secondary")} self-start`}
        >
          {messages.parents.childrenLink}
        </Link>
      </section>

      <LeaveProfile />
    </section>
  );
}

function PendingLink({
  to,
  search,
  tone,
  icon,
  count,
  one,
  many,
}: {
  to: "/tasks" | "/redemptions";
  search: { page: number; status: "COMPLETED" | "PENDING" };

  tone: HeroTone;
  icon: React.ReactElement;
  count: Recuento;
  one: string;
  many: string;
}): React.ReactElement {
  return (
    <HeroPanel tone={tone} className="motion-safe:transition-transform motion-safe:hover:scale-105">

      <span className="flex w-full items-center gap-4">
        <IconTile tone="hero">{icon}</IconTile>

        <Link
          to={to}
          search={search}
          className="flex min-w-0 flex-1 flex-col text-ink-inverted no-underline after:absolute after:inset-0"
        >
          <span className="text-display font-extrabold leading-none">

            {count.value}
            {count.exact ? "" : "+"}
          </span>
          <span className="text-body font-bold opacity-90">
            {count.value === 1 && count.exact ? one : many}
          </span>
        </Link>

        <Flecha />
      </span>
    </HeroPanel>
  );
}

function IconoTareas(): React.ReactElement {
  return (
    <Glifo>
      <path d="M4 7.5l2.5 2.5L11 5" />
      <path d="M13.5 8h7" />
      <path d="M4 17.5L6.5 20 11 15" />
      <path d="M13.5 18h7" />
    </Glifo>
  );
}

function IconoCanjes(): React.ReactElement {
  return (
    <Glifo>
      <path d="M3 8.5a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 3v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-3z" />
      <path d="M9.5 9.5v5" />
    </Glifo>
  );
}

function Flecha(): React.ReactElement {
  return (
    <span className="relative shrink-0 text-ink-inverted">
      <Glifo>
        <path d="M9 6l6 6-6 6" />
      </Glifo>
    </span>
  );
}

function Glifo({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function ChildBalance({ child }: { child: Child }): React.ReactElement {
  return (
    <li className="flex min-w-0 items-center gap-3">
      <Avatar value={child.avatar} size="small" />
      <span className="min-w-0 flex-1 truncate text-body font-semibold">{child.name}</span>
      <Coins amount={child.coins} />
    </li>
  );
}
