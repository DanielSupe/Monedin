import { Link, useNavigate } from "@tanstack/react-router";
import { messages } from "../../lib/messages.js";
import { ChildForm } from "./ChildForm.js";

export function CreateProfileScreen(): React.ReactElement {
  const navigate = useNavigate();
  const volver = (): void => void navigate({ to: "/profiles" });

  return (
    <ChildForm
      onSaved={volver}
      cancel={
        <Link to="/profiles" className="text-small">
          {messages.children.cancel}
        </Link>
      }
    />
  );
}
