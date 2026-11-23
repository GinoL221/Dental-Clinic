import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import PasswordField from "./PasswordField.svelte";

describe("PasswordField", () => {
  it("toggles input type, aria-pressed, and icon on eye button click", async () => {
    const user = userEvent.setup();
    render(PasswordField, {
      props: {
        id: "pwd",
        name: "password",
        label: "Contraseña",
        required: true,
      },
    });

    const input = screen.getByLabelText(/Contraseña/);
    const toggle = screen.getByRole("button", { name: "Mostrar contraseña" });

    expect(input).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle.querySelector("i")).toHaveClass("bi-eye");

    await user.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle.querySelector("i")).toHaveClass("bi-eye-slash");

    await user.click(toggle);
    expect(input).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle.querySelector("i")).toHaveClass("bi-eye");
  });

  it("wires aria-invalid and aria-describedby for errorText and helpText", () => {
    render(PasswordField, {
      props: {
        id: "newPassword",
        name: "newPassword",
        label: "Nueva contraseña",
        errorText: "Mínimo 6 caracteres",
        errorId: "newPassword-error",
        helpText: "Usá letras y números",
        helpId: "newPassword-help",
      },
    });

    const input = screen.getByLabelText("Nueva contraseña");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute(
      "aria-describedby",
      "newPassword-error newPassword-help",
    );
    expect(screen.getByText("Mínimo 6 caracteres")).toBeInTheDocument();
    expect(screen.getByText("Usá letras y números")).toBeInTheDocument();
  });
});
