<script>
  import { createEventDispatcher } from "svelte";

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
  let confirmButton;

  $: if (open && confirmButton) {
    confirmButton.focus();
  }

  function cancel() {
    dispatch("cancel");
  }

  /**
   * @param {KeyboardEvent} event
   */
  function handleKeydown(event) {
    if (open && event.key === "Escape") {
      cancel();
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
    class="confirm-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-dialog-title"
    aria-describedby="confirm-dialog-message"
  >
    <h5 id="confirm-dialog-title">{title}</h5>
    <p id="confirm-dialog-message">{message}</p>
    <div class="d-flex justify-content-end gap-2">
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        on:click={cancel}>{cancelLabel}</button
      >
      <button
        type="button"
        bind:this={confirmButton}
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
    /* Alpha literal over the neutral text color, pending a backdrop token
       addition (same policy as dashboard.css filter-bar literals). */
    background-color: rgba(33, 37, 41, 0.5);
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
    box-shadow: 0 0.5rem 1rem rgba(33, 37, 41, 0.3);
    z-index: 1051;
  }

  .confirm-dialog h5 {
    color: var(--color-texto);
    margin-bottom: 0.5rem;
  }

  .confirm-dialog p {
    color: var(--color-texto-muted);
    margin-bottom: 1.25rem;
  }
</style>
