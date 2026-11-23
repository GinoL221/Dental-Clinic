import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import FormCard from "./FormCard.svelte";

describe("FormCard", () => {
  it("renders title, subtitle, back link, and wide modifier", () => {
    const { container } = render(FormCard, {
      props: {
        title: "Agregar Paciente",
        subtitle: "Registrá un nuevo paciente",
        backHref: "/patients",
        backLabel: "Volver a pacientes",
        wide: true,
      },
    });

    expect(
      screen.getByRole("heading", { level: 1, name: "Agregar Paciente" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Registrá un nuevo paciente")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Volver a pacientes/ }),
    ).toHaveAttribute("href", "/patients");
    expect(container.querySelector(".auth-card--wide")).not.toBeNull();
  });

  it("renders general error and fieldErrors inside role=alert banner", () => {
    render(FormCard, {
      props: {
        title: "Editar",
        error: "Error general",
        fieldErrors: {
          email: "Email inválido",
          dni: "DNI duplicado",
        },
      },
    });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Error general");
    expect(alert).toHaveTextContent("Email inválido");
    expect(alert).toHaveTextContent("DNI duplicado");
  });
});
