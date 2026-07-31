import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server.js';
import * as api from '../../lib/api.js';
import { createMockEvent } from '../../test/mockFactory.js';

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
    const mockDentists = [{ id: 1, firstName: 'Ana', lastName: 'Gómez' }];
    vi.mocked(api.apiFetch).mockImplementation((/** @type {string} */ endpoint) =>
      endpoint.includes('/dentists') ? Promise.resolve(mockDentists) : Promise.resolve(mockSnapshot)
    );

    const event = createMockEvent({
      locals: {
        user: { id: 1, email: 'admin@clinic.com', role: 'ADMIN' },
        authToken: 'mock-token'
      }
    });
    const result = await load(event);
    expect(result).toEqual({
      user: { id: 1, email: 'admin@clinic.com', role: 'ADMIN' },
      snapshot: mockSnapshot,
      dentists: mockDentists,
      filters: { from: null, to: null, dentistId: null }
    });
    expect(api.getAuthHeaders).toHaveBeenCalledWith('mock-token');
    expect(api.apiFetch).toHaveBeenCalledWith('/api/dashboard/snapshot', expect.any(Object));
  });

  it('should throw 403 if user is not ADMIN', async () => {
    const event = createMockEvent({
      locals: {
        user: { id: 2, email: 'patient@email.com', role: 'PATIENT' },
        authToken: 'mock-token'
      }
    });
    await expect(load(event)).rejects.toMatchObject({
      status: 403
    });
  });

  it('should redirect to /login if user is not logged in', async () => {
    const event = createMockEvent({
      locals: {}
    });
    await expect(load(event)).rejects.toMatchObject({
      status: 303,
      location: '/login'
    });
  });

  it('should redirect to /login if authToken is missing even when user is present', async () => {
    const event = createMockEvent({
      locals: {
        user: { id: 1, email: 'admin@clinic.com', role: 'ADMIN' },
        authToken: null
      }
    });
    await expect(load(event)).rejects.toMatchObject({
      status: 303,
      location: '/login'
    });
  });

  it('should forward valid from/to/dentistId params to the snapshot fetch', async () => {
    const mockSnapshot = {
      totalAppointments: 3,
      totalDentists: 5,
      totalPatients: 20,
      todayAppointments: 0,
      monthlyStats: [],
      upcomingAppointments: []
    };
    const mockDentists = [{ id: 7, firstName: 'Ana', lastName: 'Gómez' }];
    vi.mocked(api.apiFetch).mockImplementation((/** @type {string} */ endpoint) =>
      endpoint.includes('/dentists') ? Promise.resolve(mockDentists) : Promise.resolve(mockSnapshot)
    );

    const event = createMockEvent({
      url: new URL('http://localhost/dashboard?from=2026-01-01&to=2026-06-01&dentistId=7'),
      locals: {
        user: { id: 1, email: 'admin@clinic.com', role: 'ADMIN' },
        authToken: 'mock-token'
      }
    });
    const result = await load(event);

    expect(api.apiFetch).toHaveBeenCalledWith(
      '/api/dashboard/snapshot?from=2026-01-01&to=2026-06-01&dentistId=7',
      expect.any(Object)
    );
    expect(result).toEqual({
      user: { id: 1, email: 'admin@clinic.com', role: 'ADMIN' },
      snapshot: mockSnapshot,
      dentists: mockDentists,
      filters: { from: '2026-01-01', to: '2026-06-01', dentistId: 7 }
    });
  });

  it('should fall back to an unfiltered fetch and echo raw values plus filterError when the range is inverted', async () => {
    const mockSnapshot = {
      totalAppointments: 10,
      totalDentists: 5,
      totalPatients: 20,
      todayAppointments: 2,
      monthlyStats: [],
      upcomingAppointments: []
    };
    vi.mocked(api.apiFetch).mockImplementation((/** @type {string} */ endpoint) =>
      endpoint.includes('/dentists') ? Promise.resolve([]) : Promise.resolve(mockSnapshot)
    );

    const event = createMockEvent({
      url: new URL('http://localhost/dashboard?from=2026-06-01&to=2026-01-01'),
      locals: {
        user: { id: 1, email: 'admin@clinic.com', role: 'ADMIN' },
        authToken: 'mock-token'
      }
    });
    const result = await load(event);

    expect(api.apiFetch).toHaveBeenCalledWith('/api/dashboard/snapshot', expect.any(Object));
    expect(result).toEqual({
      user: { id: 1, email: 'admin@clinic.com', role: 'ADMIN' },
      snapshot: mockSnapshot,
      dentists: [],
      filters: { from: '2026-06-01', to: '2026-01-01', dentistId: '' },
      filterError: 'La fecha "desde" no puede ser posterior a la fecha "hasta"'
    });
  });

  it('should fall back to an unfiltered fetch and echo a filterError for a non-numeric dentistId', async () => {
    const mockSnapshot = {
      totalAppointments: 10,
      totalDentists: 5,
      totalPatients: 20,
      todayAppointments: 2,
      monthlyStats: [],
      upcomingAppointments: []
    };
    vi.mocked(api.apiFetch).mockImplementation((/** @type {string} */ endpoint) =>
      endpoint.includes('/dentists') ? Promise.resolve([]) : Promise.resolve(mockSnapshot)
    );

    const event = createMockEvent({
      url: new URL('http://localhost/dashboard?dentistId=abc'),
      locals: {
        user: { id: 1, email: 'admin@clinic.com', role: 'ADMIN' },
        authToken: 'mock-token'
      }
    });
    const result = await load(event);

    expect(api.apiFetch).toHaveBeenCalledWith('/api/dashboard/snapshot', expect.any(Object));
    expect(result).toEqual({
      user: { id: 1, email: 'admin@clinic.com', role: 'ADMIN' },
      snapshot: mockSnapshot,
      dentists: [],
      filters: { from: '', to: '', dentistId: 'abc' },
      filterError: 'El odontólogo seleccionado no es válido'
    });
  });
});
