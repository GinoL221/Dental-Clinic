/** @type {import('./$types').PageServerLoad} */
export function load() {
  const demoMode =
    typeof process !== "undefined" && process.env?.APP_DEMO_ENABLED === "true";
  return { demoMode };
}
