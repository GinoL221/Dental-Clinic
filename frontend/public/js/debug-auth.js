function testLoginCookies() {
  // Simular cookies de login para testing
  document.cookie = "userEmail=test@example.com; path=/";
  document.cookie = "userRole=ADMIN; path=/";
  document.cookie = "authToken=fake-token-123; path=/";

  console.log("✅ Cookies de prueba creadas");
  console.log("🔄 Recarga la página para ver el cambio");

  // Recargar automáticamente
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

function clearLoginCookies() {
  // Limpiar cookies
  document.cookie =
    "userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie =
    "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  console.log("🗑️ Cookies limpiadas");
  console.log("🔄 Recarga la página para ver el cambio");

  // Recargar automáticamente
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Hacer disponible en consola del navegador
window.testLoginCookies = testLoginCookies;
window.clearLoginCookies = clearLoginCookies;

console.log("🧪 Debug tools available:");
console.log("- testLoginCookies() - Simular login");
console.log("- clearLoginCookies() - Limpiar cookies");
