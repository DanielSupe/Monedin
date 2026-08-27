import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { Alert } from "../../src/ui/Alert.js";
import { Button } from "../../src/ui/Button.js";
import { Dialog } from "../../src/ui/Dialog.js";
import { EmptyState } from "../../src/ui/EmptyState.js";
import { Skeleton } from "../../src/ui/Skeleton.js";
import { Tabs } from "../../src/ui/Tabs.js";
import { Toast, ToastProvider } from "../../src/ui/Toast.js";

describe("Alert", () => {
  it("un error interrumpe: se anuncia como alerta", () => {
    render(<Alert tone="danger">No se pudo aprobar.</Alert>);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo aprobar.");
  });

  it("un éxito no interrumpe: se anuncia como estado", () => {
    render(<Alert tone="success">Tarea aprobada.</Alert>);

    expect(screen.getByRole("status")).toHaveTextContent("Tarea aprobada.");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("el conflicto es advertencia y no error, porque nadie hizo nada mal", () => {
    render(
      <Alert tone="warning" title="Alguien se te adelantó">
        Esa tarea ya la aprobaste.
      </Alert>,
    );

    const aviso = screen.getByRole("alert");
    expect(aviso).toHaveTextContent("Alguien se te adelantó");
    expect(aviso).toHaveTextContent("Esa tarea ya la aprobaste.");
  });
});

describe("Skeleton y EmptyState", () => {
  it("el esqueleto se anuncia una vez, no una por línea", () => {
    render(<Skeleton lines={4} />);

    expect(screen.getAllByLabelText(messages.ui.loading)).toHaveLength(1);
  });

  it("el estado vacío rinde su texto y su salida", () => {
    render(
      <EmptyState
        glyph="🪙"
        title="Todavía no tienes tareas"
        description="Cuando tu papá te asigne una, aparecerá aquí."
        action={<Button>Volver</Button>}
      />,
    );

    expect(screen.getByText("Todavía no tienes tareas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver" })).toBeInTheDocument();
  });
});

function DialogoDePrueba(): React.ReactElement {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Button onClick={() => setAbierto(true)}>Dar de baja</Button>
      <Dialog
        open={abierto}
        onOpenChange={setAbierto}
        title="¿Dar de baja a Ana?"
        description="Es definitivo y no se puede deshacer."
      >
        <p>Su historial se conserva.</p>
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
  it("se anuncia con su título y su descripción", async () => {
    const user = userEvent.setup();
    render(<DialogoDePrueba />);

    await user.click(screen.getByRole("button", { name: "Dar de baja" }));

    const dialogo = screen.getByRole("dialog");
    expect(dialogo).toHaveAccessibleName("¿Dar de baja a Ana?");
    expect(dialogo).toHaveAccessibleDescription("Es definitivo y no se puede deshacer.");
  });

  it("cierra con Escape y devuelve el foco a quien lo abrió", async () => {
    const user = userEvent.setup();
    render(<DialogoDePrueba />);

    const abridor = screen.getByRole("button", { name: "Dar de baja" });
    await user.click(abridor);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();

    // El foco vuelve tras desmontar, no en el mismo tick.
    await waitFor(() => {
      expect(abridor).toHaveFocus();
    });
  });

  it("mientras está abierto, el foco no se escapa al fondo", async () => {
    const user = userEvent.setup();
    render(<DialogoDePrueba />);

    await user.click(screen.getByRole("button", { name: "Dar de baja" }));

    const dialogo = screen.getByRole("dialog");
    await user.tab();
    expect(dialogo).toContainElement(document.activeElement as HTMLElement);
  });
});

function PestanasDePrueba(): React.ReactElement {
  const [valor, setValor] = useState("pendientes");

  return (
    <Tabs
      label="Estado"
      value={valor}
      onValueChange={setValor}
      items={[
        { value: "pendientes", label: "Pendientes", content: <p>Nada pendiente.</p> },
        { value: "aprobadas", label: "Aprobadas", content: <p>Dos aprobadas.</p> },
      ]}
    />
  );
}

describe("Tabs", () => {
  it("se mueve con las flechas del teclado", async () => {
    const user = userEvent.setup();
    render(<PestanasDePrueba />);

    await user.click(screen.getByRole("tab", { name: "Pendientes" }));
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Aprobadas" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Dos aprobadas.")).toBeInTheDocument();
  });
});

function AvisoDePrueba(): React.ReactElement {
  const [abierto, setAbierto] = useState(false);

  return (
    <ToastProvider>
      <Button onClick={() => setAbierto(true)}>Aprobar</Button>
      <Toast open={abierto} onOpenChange={setAbierto} tone="success" title="Tarea aprobada" />
    </ToastProvider>
  );
}

describe("Toast", () => {
  it("aparece al dispararse y se puede descartar", async () => {
    const user = userEvent.setup();
    render(<AvisoDePrueba />);

    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    expect(screen.getByText("Tarea aprobada")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: messages.ui.dismiss }));
    expect(screen.queryByText("Tarea aprobada")).toBeNull();
  });
});
