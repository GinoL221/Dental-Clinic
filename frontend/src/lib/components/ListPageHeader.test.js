import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import ListPageHeader from "./ListPageHeader.svelte";

describe("ListPageHeader", () => {
  it("renders h1 title, default labeled search input, and hides optional link and count", () => {
    const { container } = render(ListPageHeader, {
      props: {
        title: "Pacientes",
      },
    });

    expect(
      screen.getByRole("heading", { level: 1, name: "Pacientes" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    const searchInput = screen.getByRole("searchbox", { name: "Buscar" });
    expect(searchInput).toHaveAttribute("id", "list-search-input");
    expect(searchInput).toHaveAttribute("placeholder", "Buscar...");
    expect(searchInput).toHaveAttribute("autocorrect", "off");
    expect(searchInput).toHaveAttribute("autocapitalize", "none");
    expect(searchInput).toHaveAttribute("spellcheck", "false");
    expect(searchInput).toHaveValue("");

    expect(container.querySelector(".list-title-rule")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("renders add link only when canAdd, addHref, and addLabel are all provided", async () => {
    const { rerender } = render(ListPageHeader, {
      props: {
        title: "Odontólogos",
        canAdd: false,
        addHref: "/dentists/add",
        addLabel: "Agregar Odontólogo",
      },
    });

    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    await rerender({
      title: "Odontólogos",
      canAdd: true,
      addHref: "/dentists/add",
      addLabel: undefined,
    });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    await rerender({
      title: "Odontólogos",
      canAdd: true,
      addHref: undefined,
      addLabel: "Agregar Odontólogo",
    });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    await rerender({
      title: "Odontólogos",
      canAdd: true,
      addHref: "/dentists/add",
      addLabel: "Agregar Odontólogo",
    });

    const addLink = screen.getByRole("link", { name: /Agregar Odontólogo/ });
    expect(addLink).toHaveAttribute("href", "/dentists/add");
    expect(addLink.querySelector("i")).toHaveAttribute("aria-hidden", "true");
  });

  it("updates search input on typing and clears it with the clear button", async () => {
    const user = userEvent.setup();

    render(ListPageHeader, {
      props: {
        title: "Turnos",
        searchQuery: "Pérez",
        searchLabel: "Buscar turnos",
        searchPlaceholder: "Buscar por paciente o fecha...",
        searchId: "appointments-search",
      },
    });

    const searchInput = screen.getByRole("searchbox", {
      name: "Buscar turnos",
    });
    expect(searchInput).toHaveAttribute("id", "appointments-search");
    expect(searchInput).toHaveAttribute(
      "placeholder",
      "Buscar por paciente o fecha...",
    );
    expect(searchInput).toHaveValue("Pérez");

    await user.type(searchInput, " Gómez");
    expect(searchInput).toHaveValue("Pérez Gómez");

    const clearBtn = screen.getByRole("button", { name: "Limpiar búsqueda" });
    await user.click(clearBtn);
    expect(searchInput).toHaveValue("");
  });

  it("formats singular and plural resultCount inside role=status", async () => {
    const { rerender } = render(ListPageHeader, {
      props: {
        title: "Pacientes",
        resultCount: 0,
      },
    });

    expect(screen.getByRole("status")).toHaveTextContent("0 resultados");

    await rerender({ title: "Pacientes", resultCount: 1 });
    expect(screen.getByRole("status")).toHaveTextContent("1 resultado");

    await rerender({ title: "Pacientes", resultCount: 4 });
    expect(screen.getByRole("status")).toHaveTextContent("4 resultados");
  });
});
