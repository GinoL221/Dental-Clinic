import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import EmptyState from "./EmptyState.svelte";

describe("EmptyState", () => {
  it("renders default title, message, h2 heading, and decorative inbox icon", () => {
    const { container } = render(EmptyState);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "No se encontraron resultados",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Modificá tu búsqueda o agregá un nuevo registro."),
    ).toBeInTheDocument();

    const icon = container.querySelector("i.empty-state-icon");
    expect(icon).not.toBeNull();
    expect(icon).toHaveClass("bi", "bi-inbox");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("renders custom title, message, icon, and heading level", () => {
    const { container } = render(EmptyState, {
      props: {
        title: "Sin turnos registrados",
        message: "Creá el primer turno para comenzar.",
        icon: "bi-calendar-x",
        level: 3,
      },
    });

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Sin turnos registrados",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Creá el primer turno para comenzar."),
    ).toBeInTheDocument();

    const icon = container.querySelector("i.empty-state-icon");
    expect(icon).not.toBeNull();
    expect(icon).toHaveClass("bi", "bi-calendar-x");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});
