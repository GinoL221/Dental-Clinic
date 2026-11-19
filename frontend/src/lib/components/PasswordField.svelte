<script>
  import { createEventDispatcher } from "svelte";

  /** @type {string} */
  export let id;
  /** @type {string} */
  export let name;
  /** @type {string} */
  export let label;
  /** @type {string} */
  export let labelIcon = "";
  /** @type {string} */
  export let value = "";
  /** @type {string} */
  export let placeholder = "";
  /** @type {import('svelte/elements').FullAutoFill | null | undefined} */
  export let autocomplete = undefined;
  /** @type {"enter" | "done" | "go" | "next" | "previous" | "search" | "send" | undefined} */
  export let enterkeyhint = undefined;
  /** @type {number | undefined} */
  export let minlength = undefined;
  /** @type {boolean} */
  export let required = false;
  /** @type {boolean} */
  export let invalid = false;
  /** @type {string | undefined} */
  export let describedBy = undefined;
  /** @type {string | undefined} */
  export let helpText = undefined;
  /** @type {string | undefined} */
  export let helpId = undefined;
  /** @type {string | undefined} */
  export let errorText = undefined;
  /** @type {string | undefined} */
  export let errorId = undefined;
  /** @type {string} */
  export let toggleLabel = "Mostrar contraseña";
  /** @type {string} */
  export let wrapperClass = "mb-3";

  const dispatch = createEventDispatcher();

  let showPassword = false;

  $: isInvalid = invalid || Boolean(errorText);
  $: computedDescribedBy =
    [
      describedBy,
      errorText && errorId ? errorId : null,
      helpText && helpId ? helpId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  /** @param {Event} event */
  function handleInput(event) {
    value = /** @type {HTMLInputElement} */ (event.currentTarget).value;
    dispatch("input", event);
  }
</script>

<div class={wrapperClass}>
  <label for={id} class="form-label">
    {#if labelIcon}<i class="{labelIcon} me-1" aria-hidden="true"
      ></i>{/if}{label}{#if required}{" "}<span aria-hidden="true">*</span>{/if}
  </label>
  <div class="position-relative">
    <input
      type={showPassword ? "text" : "password"}
      class="form-control auth-input password-input"
      class:is-invalid={isInvalid}
      {id}
      {name}
      {placeholder}
      {value}
      {autocomplete}
      {enterkeyhint}
      {minlength}
      {required}
      aria-invalid={isInvalid ? "true" : undefined}
      aria-describedby={computedDescribedBy}
      on:input={handleInput}
      on:blur
    />
    <button
      type="button"
      class="btn-eye-toggle"
      on:click={() => (showPassword = !showPassword)}
      aria-label={toggleLabel}
      aria-pressed={showPassword}
    >
      <i
        class={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}
        aria-hidden="true"
      ></i>
    </button>
  </div>
  {#if errorText && errorId}
    <p id={errorId} class="field-error">{errorText}</p>
  {/if}
  {#if helpText && helpId}
    <div id={helpId} class="auth-help-text">{helpText}</div>
  {/if}
</div>
