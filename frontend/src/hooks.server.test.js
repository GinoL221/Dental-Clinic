import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handle } from './hooks.server.js';
import * as api from './lib/api.js';
import { createMockEvent } from './test/mockFactory.js';

vi.mock('./lib/api.js', () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` }))
}));

describe('Server Hooks', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should redirect to /login if token is missing on guarded route', async () => {
    const event = createMockEvent({
      url: new URL('http://localhost/dashboard'),
      cookies: {
        get: vi.fn().mockReturnValue(undefined)
      }
    });
    const resolve = vi.fn();

    await expect(handle({ event, resolve })).rejects.toMatchObject({
      status: 303,
      location: '/login'
    });
    expect(event.locals.user).toBeNull();
    expect(event.locals.authToken).toBeNull();
  });

  it('should allow public routes without token', async () => {
    const event = createMockEvent({
      url: new URL('http://localhost/login'),
      cookies: {
        get: vi.fn().mockReturnValue(undefined)
      }
    });
    const resolve = vi.fn().mockResolvedValue('resolved response');

    const result = await handle({ event, resolve });
    expect(result).toBe('resolved response');
    expect(event.locals.user).toBeNull();
    expect(event.locals.authToken).toBeNull();
  });

  it('should populate event.locals.user with the five-field profile and keep the token private on event.locals.authToken', async () => {
    const event = createMockEvent({
      url: new URL('http://localhost/dashboard'),
      cookies: {
        get: vi.fn().mockImplementation((name) => {
          if (name === 'authToken') return 'valid-token';
          if (name === 'userRole') return 'ADMIN';
          if (name === 'userEmail') return 'admin@clinic.com';
        })
      }
    });
    const resolve = vi.fn().mockResolvedValue('resolved response');

    const safeProfile = {
      id: 1,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@clinic.com',
      role: 'ADMIN'
    };

    vi.mocked(api.apiFetch).mockResolvedValue(safeProfile);
    vi.mocked(api.getAuthHeaders).mockImplementation((token) => ({
      Authorization: `Bearer ${token}`
    }));

    const result = await handle({ event, resolve });

    expect(api.apiFetch).toHaveBeenCalledWith('/api/auth/me', {
      headers: { Authorization: 'Bearer valid-token' }
    });
    expect(result).toBe('resolved response');
    expect(event.locals.user).toEqual(safeProfile);
    expect(event.locals.authToken).toBe('valid-token');
    expect(event.locals.user).not.toHaveProperty('token');
    expect(JSON.stringify(event.locals.user)).not.toContain('valid-token');
  });

  it('should clear auth cookies, null both locals, and redirect to /login when the session is stale on a guarded route', async () => {
    const event = createMockEvent({
      url: new URL('http://localhost/dashboard'),
      cookies: {
        get: vi.fn().mockImplementation((name) => {
          if (name === 'authToken') return 'stale-token';
        }),
        delete: vi.fn()
      }
    });
    const resolve = vi.fn();

    const staleError = Object.assign(new Error('Unauthorized'), { status: 401 });
    vi.mocked(api.apiFetch).mockRejectedValue(staleError);

    await expect(handle({ event, resolve })).rejects.toMatchObject({
      status: 303,
      location: '/login'
    });

    expect(event.locals.user).toBeNull();
    expect(event.locals.authToken).toBeNull();
    expect(event.cookies.delete).toHaveBeenCalledWith('authToken', { path: '/' });
    expect(event.cookies.delete).toHaveBeenCalledWith('userRole', { path: '/' });
    expect(event.cookies.delete).toHaveBeenCalledWith('userEmail', { path: '/' });
  });

  it('should clear auth cookies and resolve without redirecting when the session is stale on a public route', async () => {
    const event = createMockEvent({
      url: new URL('http://localhost/login'),
      cookies: {
        get: vi.fn().mockImplementation((name) => {
          if (name === 'authToken') return 'stale-token';
        }),
        delete: vi.fn()
      }
    });
    const resolve = vi.fn().mockResolvedValue('resolved response');

    const staleError = Object.assign(new Error('Unauthorized'), { status: 401 });
    vi.mocked(api.apiFetch).mockRejectedValue(staleError);

    const result = await handle({ event, resolve });

    expect(result).toBe('resolved response');
    expect(event.locals.user).toBeNull();
    expect(event.locals.authToken).toBeNull();
    expect(event.cookies.delete).toHaveBeenCalledWith('authToken', { path: '/' });
  });
});
