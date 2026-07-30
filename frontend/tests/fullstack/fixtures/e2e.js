// Fixtures for process-runner tests only (PR2 scope): env/readiness building
// blocks, not role-based storage-state fixtures for browser journeys (PR3).
import { spawn } from 'node:child_process';
import net from 'node:net';
import { REQUIRED_ENV_VARS } from '../run-fullstack.js';

export { REQUIRED_ENV_VARS };

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

export function envWithout(...names) {
  const env = validEnv();
  for (const name of names) delete env[name];
  return env;
}

// Spawns a real, disposable child process hosting a tiny HTTP responder so
// readiness/port/exit behavior is exercised against a genuine OS process,
// without depending on the real Spring Boot/SvelteKit stack (PR3's job).
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

export function occupyPort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

export const releasePort = (server) => new Promise((resolve) => server.close(() => resolve()));

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
