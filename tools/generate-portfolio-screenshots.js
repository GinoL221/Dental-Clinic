const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Configuración
const config = {
  frontendUrl: 'http://localhost:3000',
  backendUrl: 'http://localhost:8080',
  outputDir: path.join(__dirname, 'screenshots'),
  viewport: { width: 1920, height: 1080 },
  mobileViewport: { width: 375, height: 812 },
  testCredentials: {
    email: 'admin@dentalclinic.com',
    password: 'admin123'
  }
};

// Crear directorio de salida si no existe
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, filename, fullPage = false) {
  const filepath = path.join(config.outputDir, filename);
  await page.screenshot({ 
    path: filepath, 
    fullPage,
    type: 'png'
  });
  console.log(`✅ Screenshot saved: ${filename}`);
}

async function performLogin(page) {
  console.log('🔑 Attempting login...');
  
  try {
    await page.goto(`${config.frontendUrl}/users/login`, { waitUntil: 'networkidle2', timeout: 10000 });
    await delay(1000);
    
    // Buscar campos de login
    const emailSelectors = [
      'input[type="email"]',
      'input#email', 
      'input[name="email"]',
      'input#userEmail',
      '.email-input'
    ];
    
    const passwordSelectors = [
      'input[type="password"]',
      'input#password',
      'input[name="password"]',
      'input#userPassword',
      '.password-input'
    ];
    
    const buttonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      '.btn-login',
      '.login-btn',
      '#loginButton'
    ];
    
    let emailField = null;
    let passwordField = null;
    let loginButton = null;
    
    // Encontrar campo email
    for (const selector of emailSelectors) {
      if (await waitForSelector(page, selector, 1000)) {
        emailField = selector;
        break;
      }
    }
    
    // Encontrar campo password
    for (const selector of passwordSelectors) {
      if (await waitForSelector(page, selector, 1000)) {
        passwordField = selector;
        break;
      }
    }
    
    // Encontrar botón login
    for (const selector of buttonSelectors) {
      if (await waitForSelector(page, selector, 1000)) {
        loginButton = selector;
        break;
      }
    }
    
    if (emailField && passwordField && loginButton) {
      console.log('📝 Filling login form...');
      
      // Limpiar campos y llenar
      await page.click(emailField, { clickCount: 3 });
      await page.type(emailField, config.testCredentials.email);
      
      await page.click(passwordField, { clickCount: 3 });
      await page.type(passwordField, config.testCredentials.password);
      
      console.log('🚀 Submitting login...');
      await page.click(loginButton);
      
      // Esperar redirección
      await delay(3000);
      
      // Verificar si el login fue exitoso
      const currentUrl = page.url();
      if (currentUrl.includes('dashboard') || 
          currentUrl.includes('index') || 
          !currentUrl.includes('login')) {
        console.log('✅ Login successful!');
        return true;
      } else {
        console.log('❌ Login failed - still on login page');
        return false;
      }
    } else {
      console.log('❌ Could not find login form elements');
      console.log(`Email field: ${emailField}, Password field: ${passwordField}, Button: ${loginButton}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function waitForSelector(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.warn(`⚠️  Selector not found: ${selector}`);
    return false;
  }
}

async function generateScreenshots() {
  console.log('🚀 Starting portfolio screenshot generation...');
  
  const browser = await puppeteer.launch({
    headless: 'new', // Usar el nuevo modo headless
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport(config.viewport);

    // 1. Landing page / Home
    console.log('📸 Capturing landing page...');
    try {
      await page.goto(config.frontendUrl, { waitUntil: 'networkidle2', timeout: 10000 });
      await delay(2000);
      await takeScreenshot(page, '01_landing_page.png', true);
    } catch (error) {
      console.error('❌ Error capturing landing page:', error.message);
    }

    // 2. Login page
    console.log('📸 Capturing login page...');
    try {
      await page.goto(`${config.frontendUrl}/users/login`, { waitUntil: 'networkidle2' });
      await delay(1500);
      await takeScreenshot(page, '02_login_page.png');
    } catch (error) {
      console.error('❌ Error capturing login page:', error.message);
    }

    // 3. Register page
    console.log('📸 Capturing register page...');
    try {
      await page.goto(`${config.frontendUrl}/users/register`, { waitUntil: 'networkidle2' });
      await delay(1500);
      await takeScreenshot(page, '03_register_page.png');
    } catch (error) {
      console.error('❌ Error capturing register page:', error.message);
    }

    // 4. Perform login and capture authenticated pages
    const loginSuccess = await performLogin(page);
    
    if (loginSuccess) {
      console.log('🎯 Capturing authenticated pages...');
      
      // Dashboard
      console.log('📸 Capturing dashboard...');
      try {
        // Intentar ir al dashboard desde diferentes rutas posibles
        const dashboardUrls = [
          `${config.frontendUrl}/dashboard`,
          `${config.frontendUrl}/index`,
          `${config.frontendUrl}/home`,
          `${config.frontendUrl}/`
        ];
        
        for (const url of dashboardUrls) {
          try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 5000 });
            break;
          } catch (e) {
            continue;
          }
        }
        
        await delay(2000);
        await takeScreenshot(page, '04_dashboard.png', true);
      } catch (error) {
        console.error('❌ Error capturing dashboard:', error.message);
      }

      // Dentists page
      console.log('📸 Capturing dentists list...');
      try {
        await page.goto(`${config.frontendUrl}/dentists`, { waitUntil: 'networkidle2' });
        await delay(3000); // Más tiempo para cargar datos
        await takeScreenshot(page, '05_dentists_list.png', true);
      } catch (error) {
        console.error('❌ Error capturing dentists page:', error.message);
      }

      // Patients page
      console.log('📸 Capturing patients list...');
      try {
        await page.goto(`${config.frontendUrl}/patients`, { waitUntil: 'networkidle2' });
        await delay(3000);
        await takeScreenshot(page, '06_patients_list.png', true);
      } catch (error) {
        console.error('❌ Error capturing patients page:', error.message);
      }

      // Appointments page
      console.log('📸 Capturing appointments list...');
      try {
        await page.goto(`${config.frontendUrl}/appointments`, { waitUntil: 'networkidle2' });
        await delay(3000);
        await takeScreenshot(page, '07_appointments_list.png', true);
      } catch (error) {
        console.error('❌ Error capturing appointments page:', error.message);
      }
      
    } else {
      console.log('⚠️  Skipping authenticated pages due to login failure');
      
      // Intentar capturar páginas directamente (pueden mostrar login redirect o data vacía)
      console.log('📸 Capturing pages without authentication...');
      
      try {
        await page.goto(`${config.frontendUrl}/dentists`, { waitUntil: 'networkidle2' });
        await delay(2000);
        await takeScreenshot(page, '05_dentists_list_unauth.png', true);
      } catch (error) {
        console.error('❌ Error capturing dentists page:', error.message);
      }

      try {
        await page.goto(`${config.frontendUrl}/patients`, { waitUntil: 'networkidle2' });
        await delay(2000);
        await takeScreenshot(page, '06_patients_list_unauth.png', true);
      } catch (error) {
        console.error('❌ Error capturing patients page:', error.message);
      }

      try {
        await page.goto(`${config.frontendUrl}/appointments`, { waitUntil: 'networkidle2' });
        await delay(2000);
        await takeScreenshot(page, '07_appointments_list_unauth.png', true);
      } catch (error) {
        console.error('❌ Error capturing appointments page:', error.message);
      }
    }

    // 8. Mobile version (responsive)
    console.log('📱 Capturing mobile version...');
    try {
      await page.setViewport(config.mobileViewport);
      await page.goto(config.frontendUrl, { waitUntil: 'networkidle2' });
      await delay(2000);
      await takeScreenshot(page, '08_mobile_home.png');
      
      // Reset viewport
      await page.setViewport(config.viewport);
    } catch (error) {
      console.error('❌ Error capturing mobile version:', error.message);
    }

    console.log('✨ Screenshot generation completed!');
    console.log(`📁 Screenshots saved to: ${config.outputDir}`);

  } catch (error) {
    console.error('❌ Fatal error during screenshot generation:', error);
  } finally {
    await browser.close();
  }
}

// Verificar que los servicios estén ejecutándose antes de comenzar
async function checkServices() {
  console.log('🔍 Checking if services are running...');
  
  try {
    const response = await fetch(config.frontendUrl);
    console.log('✅ Frontend service is running');
    return true;
  } catch (error) {
    console.error('❌ Frontend service not accessible. Make sure to run:');
    console.error('   cd frontend && npm start');
    console.error('   Frontend should be running on http://localhost:3000');
    return false;
  }
}

// Función principal
async function main() {
  console.log('🎯 Dental Clinic Portfolio Screenshot Generator');
  console.log('================================================');
  
  // Comentamos la verificación de servicios para que funcione offline
  // if (!(await checkServices())) {
  //   process.exit(1);
  // }
  
  await generateScreenshots();
  
  console.log('');
  console.log('🎉 Done! Next steps:');
  console.log('   1. Review screenshots in tools/screenshots/');
  console.log('   2. Add them to your portfolio documentation');
  console.log('   3. Consider creating a short demo video');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateScreenshots, config };