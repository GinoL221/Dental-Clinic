// Fixtures for process-runner tests only (PR2 scope, plus the PR3 correction's
// pickBookableTime coverage in process-runner.spec.js): env/readiness building
// blocks and fake-service helpers, consumed only by process-runner.spec.js.
// Playwright browser-journey fixtures (storage states, nextUtcWeekday, etc.)
// live in ./e2e.js instead — split out for one coherent purpose per file.
import { spawn } from 'node:child_process';
import net from 'node:net';
import { REQUIRED_ENV_VARS } from '../run-fullstack.js';

/** @typedef {import('../run-fullstack.js').Environment} Environment */
/** @typedef {import('node:child_process').ChildProcess} ChildProcess */
/** @typedef {import('node:net').Server} Server */
/** @typedef {{ port: number, statusCode?: number, neverReady?: boolean, exitCode?: number, exitAfterMs?: number }} FakeServiceOptions */

export { REQUIRED_ENV_VARS };

/**
 * @param {Partial<Environment>} [overrides={}]
 * @returns {Environment}
 */
export function validEnv(overrides = {}) {
  return {
    JWT_SECRET: 'fixture-secret-value-never-asserted',
    E2E_ADMIN_EMAIL: 'admin@e2e.fixture',
    E2E_ADMIN_PASSWORD: 'AdminFixture123!',
    E2E_NON_ADMIN_EMAIL: 'patient@e2e.fixture',
    E2E_NON_ADMIN_PASSWORD: 'PatientFixture123!',
    ...overrides,
  };
}

/** @param {...string} names */
export function envWithout(...names) {
  const env = validEnv();
  for (const name of names) delete env[name];
  return env;
}

// Spawns a real, disposable child process hosting a tiny HTTP responder so
// readiness/port/exit behavior is exercised against a genuine OS process,
// without depending on the real Spring Boot/SvelteKit stack (PR3's job).
/** @param {FakeServiceOptions} options @returns {ChildProcess} */
export function spawnFakeService({
  port,
  statusCode = 200,
  neverReady = false,
  exitCode,
  exitAfterMs = 30,
}) {
  const script = `
    const http = require('http');
    ${exitCode === undefined ? '' : `setTimeout(() => process.exit(${exitCode}), ${exitAfterMs});`}
    ${neverReady ? '' : `http.createServer((q, r) => { r.writeHead(${statusCode}); r.end('{}'); }).listen(${port}, '127.0.0.1');`}
    setInterval(() => {}, 1000 << 20);
  `;
  return spawn(process.execPath, ['-e', script], { stdio: ['ignore', 'pipe', 'pipe'] });
}

/** @param {number} port @returns {Promise<Server>} */
export function occupyPort(port) {
  /** @type {Promise<Server>} */
  const result = new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
  return result;
}

/** @param {Server} server @returns {Promise<void>} */
export const releasePort = (server) => {
  /** @type {Promise<void>} */
  const result = new Promise((resolve) => server.close(() => resolve()));
  return result;
};

/**
 * @param {number} port
 * @param {string} [host='127.0.0.1']
 * @returns {Promise<boolean>}
 */
export function isPortFree(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.once('connect', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(true));
  });
}
