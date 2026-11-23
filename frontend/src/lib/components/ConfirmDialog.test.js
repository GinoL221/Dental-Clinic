import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import ConfirmDialog from "./ConfirmDialog.svelte";

describe("ConfirmDialog", () => {
  it("does not render dialog when closed", () => {
    render(ConfirmDialog, {
      props: { open: false, title: "Eliminar", message: "¿Seguro?" },
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders title, message, labels, and moves initial focus to cancel button", async () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Abrir";
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender, unmount } = render(ConfirmDialog, {
      props: {
        open: true,
        title: "Eliminar turno",
        message: "Esta acción no se puede deshacer.",
        confirmLabel: "Sí, eliminar",
        cancelLabel: "Volver",
      },
    });

    try {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(screen.getByText("Eliminar turno")).toBeInTheDocument();
      expect(
        screen.getByText("Esta acción no se puede deshacer."),
      ).toBeInTheDocument();

      const cancelBtn = screen.getByRole("button", { name: "Volver" });
      await vi.waitFor(() => {
        expect(cancelBtn).toHaveFocus();
      });

      // Closing restores focus to the trigger element
      await rerender({ open: false });
      await vi.waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    } finally {
      unmount();
      trigger.remove();
    }
  });

  it("emits confirm and cancel via buttons, backdrop click, and Escape key", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { container } = render(ConfirmDialog, {
      props: { open: true, title: "Confirmar", message: "Detalle" },
      events: { confirm: onConfirm, cancel: onCancel },
    });

    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(2);

    const backdrop = container.querySelector(".confirm-backdrop");
    expect(backdrop).not.toBeNull();
    if (backdrop) {
      await user.click(backdrop);
    }
    expect(onCancel).toHaveBeenCalledTimes(3);
  });

  it("traps Tab and Shift+Tab focus within the dialog", async () => {
    render(ConfirmDialog, {
      props: { open: true, title: "Trap", message: "Body" },
    });

    const cancelBtn = screen.getByRole("button", { name: "Cancelar" });
    const confirmBtn = screen.getByRole("button", { name: "Confirmar" });

    await vi.waitFor(() => {
      expect(cancelBtn).toHaveFocus();
    });

    // Shift+Tab from first button wraps to last button
    await fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(confirmBtn).toHaveFocus();

    // Tab from last button wraps back to first button
    await fireEvent.keyDown(window, { key: "Tab", shiftKey: false });
    expect(cancelBtn).toHaveFocus();
  });
});
