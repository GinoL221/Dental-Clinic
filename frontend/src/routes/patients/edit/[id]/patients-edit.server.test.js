import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server.js';
import * as api from '../../../../lib/api.js';
import { createMockEvent } from '../../../../test/mockFactory.js';

vi.mock('../../../../lib/api.js', () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` }))
}));

describe('Patient Edit Route Server Actions & Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('load()', () => {
    it('should redirect to /login if user is not authenticated', async () => {
      const event = createMockEvent({ params: { id: '1' }, locals: {} });
      await expect(load(event)).rejects.toMatchObject({
        status: 303,
        location: '/login'
      });
    });

    it('should load patient details if authenticated', async () => {
      const mockPatient = { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@doe.com' };
      vi.mocked(api.apiFetch).mockResolvedValue(mockPatient);

      const event = createMockEvent({
        params: { id: '1' },
        locals: { user: { id: 1, token: 'mock-token' } }
      });

      const result = await load(event);
      expect(result).toEqual({ patient: mockPatient });
      expect(api.apiFetch).toHaveBeenCalledWith('/api/patients/1', {
        headers: { Authorization: 'Bearer mock-token' }
      });
    });
  });

  describe('actions.default', () => {
    it('should update patient successfully and redirect to /patients', async () => {
      const formData = new URLSearchParams();
      formData.append('firstName', 'Jane');
      formData.append('lastName', 'Doe');
      formData.append('email', 'jane@doe.com');
      formData.append('cardIdentity', '12345678');
      formData.append('admissionDate', '2026-07-07');
      formData.append('street', 'Av. Siempreviva');
      formData.append('number', '742');
      formData.append('location', 'Springfield');
      formData.append('province', 'IL');

      const request = {
        formData: vi.fn().mockResolvedValue(formData)
      };

      vi.mocked(api.apiFetch).mockResolvedValue('Patient updated');

      const event = createMockEvent({
        params: { id: '1' },
        request,
        locals: { user: { id: 1, token: 'mock-token' } }
      });

      await expect(actions.default(event)).rejects.toMatchObject({
        status: 303,
        location: '/patients'
      });

      expect(api.apiFetch).toHaveBeenCalledWith('/api/patients/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token'
        },
        body: expect.any(String)
      });
    });
  });
});
