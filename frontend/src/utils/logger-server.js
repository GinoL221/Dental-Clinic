// Logger simple para uso en Node (servidor)
const DEBUG = process.env.APP_DEBUG === 'true' || process.env.APP_DEBUG === '1' || false;

const logger = {
  log: (...args) => { if (DEBUG) console.log(...args); },
  info: (...args) => { if (DEBUG) console.info(...args); },
  debug: (...args) => { if (DEBUG) console.debug(...args); },
  warn: (...args) => { try { console.warn(...args); } catch (e) {} },
  error: (...args) => { try { console.error(...args); } catch (e) {} },
};

module.exports = logger;
