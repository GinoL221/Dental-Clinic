import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server.js';
import * as api from '../../../lib/api.js';
import { createMockEvent } from '../../../test/mockFactory.js';

vi.mock('../../../lib/api.js', () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` }))
}));

describe('Patient Add Route Server Actions & Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('load()', () => {
    it('should redirect to /login if user is not authenticated', async () => {
      const event = createMockEvent({ locals: {} });
      await expect(load(event)).rejects.toMatchObject({
        status: 303,
        location: '/login'
      });
    });

    it('should return empty object if authenticated', async () => {
      const event = createMockEvent({ locals: { user: { id: 1 } } });
      const result = await load(event);
      expect(result).toEqual({});
    });
  });

  describe('actions.default', () => {
    it('should create patient successfully and redirect to /patients', async () => {
      const formData = new URLSearchParams();
      formData.append('firstName', 'Jane');
      formData.append('lastName', 'Doe');
      formData.append('email', 'jane@doe.com');
      formData.append('cardIdentity', '12345678');
      formData.append('street', 'Av. Siempreviva');
      formData.append('number', '742');
      formData.append('location', 'Springfield');
      formData.append('province', 'IL');

      const request = {
        formData: vi.fn().mockResolvedValue(formData)
      };

      vi.mocked(api.apiFetch).mockResolvedValue({ id: 1 });

      const event = createMockEvent({
        request,
        locals: { user: { id: 1, token: 'mock-token' } }
      });

      await expect(actions.default(event)).rejects.toMatchObject({
        status: 303,
        location: '/patients'
      });

      expect(api.apiFetch).toHaveBeenCalledWith('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token'
        },
        body: expect.any(String)
      });
    });

    it('should return error when backend returns 409 conflict', async () => {
      const formData = new URLSearchParams();
      formData.append('firstName', 'Jane');
      formData.append('lastName', 'Doe');
      formData.append('email', 'jane@doe.com');
      formData.append('cardIdentity', '12345678');

      const request = {
        formData: vi.fn().mockResolvedValue(formData)
      };

      const error = Object.assign(new Error('Conflict'), { status: 409 });
      vi.mocked(api.apiFetch).mockRejectedValue(error);

      const event = createMockEvent({
        request,
        locals: { user: { id: 1, token: 'mock-token' } }
      });

      const result = await actions.default(event);
      expect(result).toEqual({
        success: false,
        error: 'Ya existe un paciente con ese DNI o email.',
        oldData: expect.any(Object)
      });
    });
  });
});
