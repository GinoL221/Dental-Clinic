import { vi } from 'vitest';

/**
 * Creates a mock RequestEvent / ServerLoadEvent for SvelteKit tests.
 * @param {Object} [options]
 * @param {Partial<App.Locals>} [options.locals]
 * @param {Record<string, string>} [options.params]
 * @param {Partial<Request> | { formData?: import('vitest').Mock }} [options.request]
 * @param {Partial<import('@sveltejs/kit').Cookies>} [options.cookies]
 * @param {URL} [options.url]
 * @returns {any}
 */
export function createMockEvent(options = {}) {
  const url = options.url || new URL('http://localhost');
  const params = options.params || {};
  const locals = options.locals || {};
  
  const defaultCookies = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    serialize: vi.fn()
  };
  const cookies = { ...defaultCookies, ...options.cookies };

  const defaultRequest = {
    method: 'GET',
    headers: new Headers(),
    url: url.toString(),
    formData: vi.fn().mockResolvedValue(new FormData())
  };
  const request = { ...defaultRequest, ...options.request };

  return {
    url,
    params,
    locals,
    cookies,
    request
  };
}
