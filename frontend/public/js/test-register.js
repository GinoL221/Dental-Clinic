// Simple script de diagnóstico para el registro
console.log("🔍 DIAGNÓSTICO DE REGISTRO INICIADO");

document.addEventListener("DOMContentLoaded", function() {
  console.log("🔍 DOM Cargado - Verificando elementos...");
  
  // Verificar que los elementos existen
  const form = document.getElementById('registerForm');
  const passwordField = document.querySelector('[name="password"]');
  const confirmPasswordField = document.querySelector('[name="confirmPassword"]');
  const submitButton = form?.querySelector('button[type="submit"]');
  
  console.log("🔍 Elementos encontrados:", {
    form: !!form,
    passwordField: !!passwordField,
    confirmPasswordField: !!confirmPasswordField,
    submitButton: !!submitButton
  });
  
  // Verificar que las clases globales estén disponibles
  console.log("🔍 Clases globales:", {
    AuthValidationManager: typeof window.AuthValidationManager,
    authController: typeof window.authController
  });
  
  if (passwordField && confirmPasswordField) {
    console.log("✅ Configurando listeners de prueba...");
    
    // Listener simple para confirmPassword
    confirmPasswordField.addEventListener('input', function() {
      const password = passwordField.value;
      const confirmPassword = this.value;
      const errorContainer = document.getElementById('confirmPassword-error');
      
      console.log(`🔍 Validación: password='${password}', confirm='${confirmPassword}'`);
      
      if (confirmPassword && password !== confirmPassword) {
        console.log("❌ Contraseñas NO coinciden");
        if (errorContainer) {
          errorContainer.textContent = 'Las contraseñas no coinciden';
          errorContainer.style.display = 'block';
        }
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
      } else if (confirmPassword && password === confirmPassword) {
        console.log("✅ Contraseñas SÍ coinciden");
        if (errorContainer) {
          errorContainer.textContent = '';
          errorContainer.style.display = 'none';
        }
        this.classList.remove('is-invalid');
        this.classList.add('is-valid');
      }
    });
  }
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log("🔍 FORMULARIO ENVIADO - Datos:");
      
      const formData = new FormData(this);
      const data = Object.fromEntries(formData.entries());
      console.log(data);
      
      // Verificar específicamente los datos de dirección
      console.log("🏠 Datos de dirección:", {
        street: data.street,
        number: data.number,
        location: data.location,
        province: data.province
      });
      
      // Verificar contraseñas
      console.log("🔐 Validación de contraseñas:", {
        password: data.password,
        confirmPassword: data.confirmPassword,
        match: data.password === data.confirmPassword
      });
    });
  }
});
