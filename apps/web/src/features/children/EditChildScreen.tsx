import { Link } from "@tanstack/react-router";
import { alertToneFor } from "../../lib/alert-tone.js";
import { messages } from "../../lib/messages.js";
import { Alert, Skeleton, buttonClasses } from "../../ui/index.js";
import { ChildForm } from "./ChildForm.js";
import { describeChildrenError, useChild } from "./use-children.js";

export function EditChildScreen({
  childId,
  onSaved,
}: {
  childId: string;

  onSaved: () => void;
}): React.ReactElement {
  const { data: child, isPending, error } = useChild(childId);

  if (isPending) {
    return <Skeleton lines={5} />;
  }

  if (error !== null || child === undefined) {
    return (
      <section className="flex flex-col gap-4">
        <Alert tone={error === null ? "danger" : alertToneFor(error)}>
          {error === null ? messages.children.notFound : describeChildrenError(error)}
        </Alert>

        <Link
          to="/children"
          search={{ page: 1 }}
          className={`${buttonClasses("secondary")} self-start`}
        >
          {messages.children.back}
        </Link>
      </section>
    );
  }

  return (
    <ChildForm
      child={child}
      onSaved={onSaved}
      cancel={
        <Link to="/children" search={{ page: 1 }} className="text-small">
          {messages.children.cancel}
        </Link>
      }
    />
  );
}
