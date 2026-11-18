<script>
  import { createEventDispatcher, onDestroy, tick } from "svelte";

  /**
   * In-page confirmation dialog (design.md §6.1: «Eliminar exige
   * confirmación en un diálogo propio, no confirm() del navegador»).
   * Shared by the dashboard status-change flow and the delete flows of the
   * patients/dentists/appointments lists.
   */
  const dispatch = createEventDispatcher();

  /** @type {boolean} */
  export let open = false;
  /** @type {string} */
  export let title = "Confirmar acción";
  /** @type {string} */
  export let message = "";
  /** @type {string} */
  export let confirmLabel = "Confirmar";
  /** @type {string} */
  export let cancelLabel = "Cancelar";

  /** @type {HTMLButtonElement | null} */
  let cancelButton = null;
  /** @type {HTMLDivElement | null} */
  let dialogEl = null;
  /** @type {HTMLElement | null} */
  let previousFocus = null;
  let wasOpen = false;

  async function syncFocus(/** @type {boolean} */ isOpen) {
    if (isOpen && !wasOpen) {
      wasOpen = true;
      previousFocus =
        typeof document !== "undefined" &&
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      await tick();
      cancelButton?.focus();
    } else if (!isOpen && wasOpen) {
      wasOpen = false;
      const target = previousFocus;
      previousFocus = null;
      await tick();
      if (target && target.isConnected) {
        target.focus();
      }
    }
  }

  $: syncFocus(open);

  onDestroy(() => {
    if (previousFocus && previousFocus.isConnected) {
      previousFocus.focus();
    }
    previousFocus = null;
  });

  function cancel() {
    dispatch("cancel");
  }

  /**
   * @param {KeyboardEvent} event
   */
  function handleKeydown(event) {
    if (!open) return;

    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
      return;
    }

    if (event.key === "Tab" && dialogEl) {
      const focusables = Array.from(
        dialogEl.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el instanceof HTMLElement);

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !dialogEl.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialogEl.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <!-- Keyboard dismissal is handled by the Escape listener above; the
       backdrop click is a mouse-only convenience for closing the dialog. -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="confirm-backdrop" on:click={cancel}></div>
  <div
    bind:this={dialogEl}
    class="confirm-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-dialog-title"
    aria-describedby="confirm-dialog-message"
  >
    <h2 id="confirm-dialog-title">{title}</h2>
    <p id="confirm-dialog-message">{message}</p>
    <div class="d-flex justify-content-end gap-2">
      <button
        type="button"
        bind:this={cancelButton}
        class="btn btn-sm btn-outline-primary"
        on:click={cancel}>{cancelLabel}</button
      >
      <button
        type="button"
        class="btn btn-sm btn-danger"
        on:click={() => dispatch("confirm")}>{confirmLabel}</button
      >
    </div>
  </div>
{/if}

<style>
  .confirm-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1050;
  }

  .confirm-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(92vw, 26rem);
    padding: 1.5rem;
    background-color: var(--color-blanco);
    border-radius: 10px;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.2);
    z-index: 1051;
  }

  .confirm-dialog h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-texto);
    margin-bottom: 0.5rem;
  }

  .confirm-dialog p {
    color: var(--color-texto-muted);
    margin-bottom: 1.25rem;
  }
</style>
