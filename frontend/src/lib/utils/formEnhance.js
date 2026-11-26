/**
 * Builds a SvelteKit `use:enhance` submit handler that toggles a submitting
 * flag around the form update lifecycle and always resets it in `finally`.
 * @param {(submitting: boolean) => void} setSubmitting
 * @returns {import('$app/forms').SubmitFunction}
 */
export function createSubmitEnhance(setSubmitting) {
  return () => {
    setSubmitting(true);
    return async ({ update }) => {
      try {
        await update();
      } finally {
        setSubmitting(false);
      }
    };
  };
}
