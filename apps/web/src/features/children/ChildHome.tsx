import { Link } from "@tanstack/react-router";
import type { OwnTask } from "@monedin/contracts";
import { hoyConDia } from "../../lib/dates.js";
import { messages } from "../../lib/messages.js";
import { contar } from "../../lib/plural.js";
import { useSession } from "../auth/use-session.js";
import { Tutorial } from "../tutorial/Tutorial.js";
import { CHILD_STEPS } from "../tutorial/steps.js";
import {
  Badge,
  Button,
  Card,
  Coins,
  HeroPanel,
  IconTile,
  Mascota,
  ProgressRing,
  Skeleton,
  SplitLayout,
} from "../../ui/index.js";
import { LeaveProfile } from "../auth/LeaveProfile.js";
import { useCompleteTask, useOwnTasks } from "../tasks/use-tasks.js";
import { useOwnRewards } from "../rewards/use-rewards.js";
import { useOwnCoinHistory } from "../coins/use-coins.js";
import { MovementRow } from "../coins/CoinHistory.js";
import { GoalPanel } from "../rewards/GoalPanel.js";
import { avanceDeTareas } from "./home-data.js";

import {
  IconProfile,
  IconRedemptions,
  IconRewards,
  IconTasks,
} from "../../app/nav-icons.js";

const DESTINOS = [
  {
    to: "/me/tasks",
    Icono: IconTasks,
    texto: messages.tasks.myTasksTitle,
    ancla: "child-tasks",
  },
  {
    to: "/me/rewards",
    Icono: IconRewards,
    texto: messages.rewards.myRewardsTitle,
    ancla: "child-rewards",
  },
  {
    to: "/me/redemptions",
    Icono: IconRedemptions,
    texto: messages.redemptions.myRedemptionsTitle,
    ancla: undefined,
  },
  {
    to: "/me/settings",
    Icono: IconProfile,
    texto: messages.children.myProfileTitle,
    ancla: undefined,
  },
] as const;

export function ChildHome({
  name,
  coins,
}: {
  name: string;
  coins: number;
}): React.ReactElement {
  const actor = useSession().session?.actor;
  const tareas = useOwnTasks();
  const premios = useOwnRewards();

  const suyas = tareas.data?.items ?? [];
  const avance = avanceDeTareas(suyas);
  const pendientes = suyas.filter((tarea) => tarea.status === "PENDING");

  const ofrecidos = premios.data?.items ?? [];

  const enPortada = [
    ...pendientes,
    ...suyas.filter((tarea) => tarea.status === "COMPLETED"),
    ...suyas.filter((tarea) => tarea.status === "APPROVED"),
  ].slice(0, 5);

  return (
    <section className="flex w-full flex-col gap-5">

      {actor?.tutorialSeen === false && <Tutorial steps={CHILD_STEPS} />}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">

          <p className="text-small text-ink-muted first-letter:uppercase">
            {hoyConDia()}
          </p>
          <h2 className="text-display font-extrabold">
            {messages.children.homeGreeting} {name}
          </h2>
        </div>

        <Link
          to="/me/coins"
          search={{ page: 1 }}
          data-tutorial="child-balance"
          aria-label={messages.coins.seeHistory}
          className="rounded-pill flex shrink-0 items-center gap-2 border border-border bg-surface-raised px-4 py-2 no-underline shadow-card"
        >
          <Coins amount={coins} size="large" />
          <span className="text-small text-ink-muted">
            {messages.children.homeBalanceLabel}
          </span>
        </Link>
      </div>

      <div className="flex flex-col gap-5">

        {!tareas.isPending && (
          <HeroPanel
            mascot={<Mascota pose="saluda" size="large" />}
            aside={
              avance.total > 0 ? (
                <ProgressRing
                  done={avance.done}
                  total={avance.total}
                  className="size-28"
                />
              ) : undefined
            }
          >
            <p className="text-lead font-extrabold text-ink-inverted">
              {messages.children.homeGreetingLead}
            </p>
            <p className="text-body text-ink-inverted opacity-90">
              {pendientes.length === 0
                ? messages.children.homeAllDone
                : `${messages.parents.pendingTitle} ${contar(
                    pendientes.length,
                    messages.children.homePendingOne,
                    messages.children.homePendingMany,
                  )}. ${messages.children.homeMarkExplains}`}
            </p>
          </HeroPanel>
        )}
      </div>

      <SplitLayout
        aside={
          <>

            {!premios.isPending && (
              <GoalPanel rewards={ofrecidos} balance={coins} />
            )}

            <UltimasMonedas />

            <LeaveProfile variant="secondary" block />
          </>
        }
      >

        {tareas.isPending ? (
          <Skeleton lines={3} />
        ) : (
          enPortada.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="text-lead font-extrabold">
                  {messages.children.homeTasksTitle}
                </h2>
                <Link to="/me/tasks" className="text-small ml-auto font-bold">
                  {messages.children.homeTasksAll}
                </Link>
              </div>

              <ul className="flex list-none flex-col gap-2 p-0">
                {enPortada.map((tarea) => (
                  <FilaDelInicio key={tarea.id} task={tarea} />
                ))}
              </ul>
            </section>
          )
        )}

        <ul className="grid list-none grid-cols-2 gap-3 p-0">
          {DESTINOS.map((destino) => (
            <li key={destino.to} data-tutorial={destino.ancla}>
              <Link
                to={destino.to}
                className="rounded-card flex h-full flex-col items-center justify-center gap-2 border border-border bg-surface-raised p-4 text-center text-body font-semibold text-ink no-underline shadow-card transition duration-normal hover:bg-surface-sunken motion-safe:hover:scale-105"
              >
                <IconTile tone="waiting">
                  <destino.Icono />
                </IconTile>
                {destino.texto}
              </Link>
            </li>
          ))}
        </ul>
      </SplitLayout>
    </section>
  );
}

function FilaDelInicio({ task }: { task: OwnTask }): React.ReactElement {
  const complete = useCompleteTask();

  return (
    <li className="rounded-card flex flex-wrap items-center gap-3 border border-border bg-surface-raised p-3 shadow-card">
      <IconTile tone={task.status === "APPROVED" ? "coin" : "action"}>
        <IconTasks />
      </IconTile>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body truncate font-bold">{task.title}</span>

        {task.description !== null && task.status === "PENDING" && (
          <span className="text-small truncate text-ink-muted">
            {task.description}
          </span>
        )}

        {task.status === "COMPLETED" && (
          <span className="text-small text-ink-muted">
            {messages.tasks.waitingReview}
          </span>
        )}

        {task.status === "APPROVED" && (
          <span className="text-small font-bold text-done">
            {messages.tasks.earned}
          </span>
        )}
      </span>

      <Coins amount={task.coins} />

      {task.status === "PENDING" ? (
        <Button
          variant="primary"
          pending={complete.isPending}
          onClick={() => complete.mutate({ taskId: task.id })}
        >
          {messages.tasks.markDone}
        </Button>
      ) : (
        <Badge tone={task.status === "APPROVED" ? "done" : "info"}>
          {task.status === "APPROVED"
            ? messages.tasks.statusApproved
            : messages.tasks.statusCompleted}
        </Badge>
      )}
    </li>
  );
}

function UltimasMonedas(): React.ReactElement | null {
  const { data, isPending } = useOwnCoinHistory({ page: 1 });
  const ultimos = (data?.items ?? []).slice(0, 3);

  if (isPending || ultimos.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-lead font-extrabold">
          {messages.children.homeCoinsTitle}
        </h2>
        <Link
          to="/me/coins"
          search={{ page: 1 }}
          className="text-small ml-auto font-bold"
        >
          {messages.children.homeCoinsAll}
        </Link>
      </div>

      <Card>
        <ul className="flex list-none flex-col p-0">
          {ultimos.map((movimiento) => (
            <MovementRow key={movimiento.id} movement={movimiento} compact />
          ))}
        </ul>
      </Card>
    </section>
  );
}
