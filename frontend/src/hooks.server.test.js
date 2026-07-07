import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handle } from './hooks.server.js';
import * as api from './lib/api.js';

vi.mock('./lib/api.js', () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` }))
}));

describe('Server Hooks', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should redirect to /login if token is missing on guarded route', async () => {
    const event = {
      url: new URL('http://localhost/dashboard'),
      cookies: {
        get: vi.fn().mockReturnValue(undefined)
      },
      locals: {}
    };
    const resolve = vi.fn();

    await expect(handle({ event, resolve })).rejects.toMatchObject({
      status: 303,
      location: '/login'
    });
  });

  it('should allow public routes without token', async () => {
    const event = {
      url: new URL('http://localhost/login'),
      cookies: {
        get: vi.fn().mockReturnValue(undefined)
      },
      locals: {}
    };
    const resolve = vi.fn().mockResolvedValue('resolved response');

    const result = await handle({ event, resolve });
    expect(result).toBe('resolved response');
    expect(event.locals.user).toBeNull();
  });

  it('should populate event.locals.user if token is valid', async () => {
    const event = {
      url: new URL('http://localhost/dashboard'),
      cookies: {
        get: vi.fn().mockImplementation((name) => {
          if (name === 'authToken') return 'valid-token';
          if (name === 'userRole') return 'ADMIN';
          if (name === 'userEmail') return 'admin@clinic.com';
        })
      },
      locals: {}
    };
    const resolve = vi.fn().mockResolvedValue('resolved response');
    
    const mockUser = {
      id: 1,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@clinic.com',
      role: 'ADMIN',
      token: 'valid-token'
    };
    
    vi.mocked(api.apiFetch).mockResolvedValue(mockUser);

    const result = await handle({ event, resolve });
    expect(result).toBe('resolved response');
    expect(event.locals.user).toEqual(mockUser);
  });
});
