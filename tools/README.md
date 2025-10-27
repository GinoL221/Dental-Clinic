# Portfolio Tools

Este directorio contiene herramientas para generar assets del portfolio automáticamente.

## Screenshot Generator

Usa Puppeteer para capturar automáticamente pantallas del sistema:

### Instalación

```bash
npm install
```

### Uso

1. **Asegurate que el frontend esté corriendo:**

```bash
cd ../frontend
npm start  # Debería servir en http://localhost:3000
```

2. **Ejecutar el generador:**

```bash
npm run screenshots
# o directamente:
node generate-portfolio-screenshots.js
```

### Capturas generadas

- `01_landing_page.png` - Página principal
- `02_login_page.png` - Formulario de login
- `03_register_page.png` - Formulario de registro
- `04_dashboard.png` - Dashboard con estadísticas (si logra hacer login)
- `05_dentists_list.png` - Lista de dentistas
- `06_patients_list.png` - Lista de pacientes  
- `07_appointments_list.png` - Lista de citas
- `08_mobile_home.png` - Versión móvil

### Notas

- Las capturas se guardan en `tools/screenshots/`
- El script intenta hacer login automático con credenciales de demo
- Si alguna página no está disponible, continúa con las siguientes
- Funciona tanto con servicios corriendo como offline (capturas de páginas estáticas)

## Próximos pasos

1. Revisar las capturas generadas
2. Añadirlas a la documentación del portfolio
3. Considerar crear un video demo corto con OBS o similar
