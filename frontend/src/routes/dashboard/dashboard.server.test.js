import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server.js';
import * as api from '../../lib/api.js';

vi.mock('../../lib/api.js', () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` }))
}));

describe('Dashboard Route Server Loader', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should allow access if user is ADMIN', async () => {
    const mockSnapshot = {
      totalAppointments: 10,
      totalDentists: 5,
      totalPatients: 20,
      todayAppointments: 2,
      monthlyStats: [],
      upcomingAppointments: []
    };
    vi.mocked(api.apiFetch).mockResolvedValue(mockSnapshot);

    const event = {
      locals: {
        user: { id: 1, email: 'admin@clinic.com', role: 'ADMIN', token: 'mock-token' }
      }
    };
    const result = await load(event);
    expect(result).toEqual({
      user: { id: 1, email: 'admin@clinic.com', role: 'ADMIN', token: 'mock-token' },
      snapshot: mockSnapshot
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
