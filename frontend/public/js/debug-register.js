// Script de debug para verificar el funcionamiento del registro
console.log("🔍 Debug script cargado");

document.addEventListener("DOMContentLoaded", function() {
  console.log("🔍 DOM listo para debug");
  
  // Verificar que los elementos existen
  const passwordField = document.querySelector('[name="password"]');
  const confirmPasswordField = document.querySelector('[name="confirmPassword"]');
  const errorContainer = document.getElementById('confirmPassword-error');
  
  console.log("🔍 Elementos encontrados:", {
    passwordField: !!passwordField,
    confirmPasswordField: !!confirmPasswordField,
    errorContainer: !!errorContainer
  });
  
  if (passwordField && confirmPasswordField && errorContainer) {
    console.log("✅ Todos los elementos están presentes");
    
    // Agregar event listeners de prueba
    confirmPasswordField.addEventListener('input', function() {
      console.log("🔍 DEBUG: Input en confirmPassword:", this.value);
      const password = passwordField.value;
      const confirmPassword = this.value;
      
      if (confirmPassword && password !== confirmPassword) {
        console.log("❌ DEBUG: Contraseñas no coinciden");
        errorContainer.textContent = 'Las contraseñas no coinciden';
        errorContainer.style.display = 'block';
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
      } else if (confirmPassword && password === confirmPassword) {
        console.log("✅ DEBUG: Contraseñas coinciden");
        errorContainer.textContent = '';
        errorContainer.style.display = 'none';
        this.classList.remove('is-invalid');
        this.classList.add('is-valid');
      }
    });
    
    passwordField.addEventListener('input', function() {
      console.log("🔍 DEBUG: Input en password:", this.value);
      if (confirmPasswordField.value) {
        // Trigger validation on confirm field
        confirmPasswordField.dispatchEvent(new Event('input'));
      }
    });
    
    console.log("✅ Event listeners de debug agregados");
  } else {
    console.log("❌ Faltan elementos");
  }
});
