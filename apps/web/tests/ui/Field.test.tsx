import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Field } from "../../src/ui/Field.js";
import { Input } from "../../src/ui/Input.js";
import { Select } from "../../src/ui/Select.js";

describe("Field", () => {
  it("asocia la etiqueta con el control sin que la pantalla cablee ids", () => {
    render(
      <Field label="Correo">
        <Input type="email" />
      </Field>,
    );

    expect(screen.getByLabelText("Correo")).toBeInstanceOf(HTMLInputElement);
  });

  it("asocia el mensaje de error al control y lo marca inválido", () => {
    render(
      <Field label="Monedas" error="Tiene que ser al menos 1.">
        <Input type="number" />
      </Field>,
    );

    const control = screen.getByLabelText("Monedas");
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control).toHaveAccessibleDescription("Tiene que ser al menos 1.");
    // Un error que solo se ve en rojo no existe para un lector de pantalla.
    expect(screen.getByRole("alert")).toHaveTextContent("Tiene que ser al menos 1.");
  });

  it("asocia también el texto de ayuda", () => {
    render(
      <Field label="PIN" help="Lo usarás cada vez que entres.">
        <Input />
      </Field>,
    );

    expect(screen.getByLabelText("PIN")).toHaveAccessibleDescription("Lo usarás cada vez que entres.");
  });

  it("sin error, el control no se marca inválido", () => {
    render(
      <Field label="Correo">
        <Input />
      </Field>,
    );

    expect(screen.getByLabelText("Correo")).not.toHaveAttribute("aria-invalid");
  });

  it("el desplegable se cablea igual y se maneja con el teclado", async () => {
    const user = userEvent.setup();

    render(
      <Field label="Hijo">
        <Select>
          <option value="ana">Ana</option>
          <option value="luis">Luis</option>
        </Select>
      </Field>,
    );

    const control = screen.getByLabelText("Hijo");
    await user.selectOptions(control, "luis");
    expect(control).toHaveValue("luis");
  });

  it("un control suelto fuera de un Field sigue siendo válido", () => {
    render(<Input aria-label="Buscar" />);

    expect(screen.getByLabelText("Buscar")).toBeInTheDocument();
  });
});
