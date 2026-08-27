import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { requireParent } from "../app/guards.js";
import { ChildForm } from "../features/children/ChildForm.js";

/** Alta de un hijo desde la gestion del padre. */
export const Route = createFileRoute("/children/new")({
  beforeLoad: ({ context }) => requireParent(context.queryClient),
  component: NewChildRoute,
});

function NewChildRoute(): React.ReactElement {
  const navigate = useNavigate();
  const alListado = (): void => void navigate({ to: "/children", search: { page: 1 } });

  return <ChildForm onSaved={alListado} onCancel={alListado} />;
}
