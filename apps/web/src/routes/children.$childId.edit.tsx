import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { requireParent } from "../app/guards.js";
import { EditChildScreen } from "../features/children/EditChildScreen.js";

export const Route = createFileRoute("/children/$childId/edit")({
  beforeLoad: ({ context }) => requireParent(context.queryClient),
  component: EditChildRoute,
});

function EditChildRoute(): React.ReactElement {
  const { childId } = Route.useParams();
  const navigate = useNavigate();

  return (
    <EditChildScreen
      childId={childId}
      onSaved={() => void navigate({ to: "/children", search: { page: 1 } })}
    />
  );
}
