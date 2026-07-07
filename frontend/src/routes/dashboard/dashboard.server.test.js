import { describe, it, expect } from 'vitest';
import { load } from './+page.server.js';

describe('Dashboard Route Server Loader', () => {
  it('should allow access if user is ADMIN', async () => {
    const event = {
      locals: {
        user: { id: 1, email: 'admin@clinic.com', role: 'ADMIN' }
      }
    };
    const result = await load(event);
    expect(result).toEqual({
      user: { id: 1, email: 'admin@clinic.com', role: 'ADMIN' }
    });
  });

  it('should throw 403 if user is not ADMIN', async () => {
    const event = {
      locals: {
        user: { id: 2, email: 'patient@email.com', role: 'PATIENT' }
      }
    };
    await expect(load(event)).rejects.toMatchObject({
      status: 403
    });
  });

  it('should redirect to /login if user is not logged in', async () => {
    const event = {
      locals: {}
    };
    await expect(load(event)).rejects.toMatchObject({
      status: 303,
      location: '/login'
    });
  });
});
