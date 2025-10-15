// Logger ligero para controlar salida en producción
// Activar logs informativos en el navegador definiendo `window.APP_DEBUG = true` antes de cargar los scripts.
const DEBUG = (typeof window !== 'undefined' && (window.APP_DEBUG === true || window.APP_DEBUG === 'true')) || false;

const logger = {
  log: function(...args) {
    if (DEBUG) console.log(...args);
  },
  info: function(...args) {
    if (DEBUG) console.info(...args);
  },
  debug: function(...args) {
    if (DEBUG) console.debug(...args);
  },
  warn: function(...args) {
    try { console.warn(...args); } catch (e) {}
  },
  error: function(...args) {
    try { console.error(...args); } catch (e) {}
  }
};

export default logger;
