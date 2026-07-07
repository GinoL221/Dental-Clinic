import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server.js';
import * as api from '../../lib/api.js';
import { createMockEvent } from '../../test/mockFactory.js';

vi.mock('../../lib/api.js', () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` }))
}));

describe('Appointments Route Server Loader & Actions', () => {
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

    it('should load appointments list if authenticated', async () => {
      const mockAppointments = [{ id: 1, date: '2026-07-07T10:00:00', description: 'Cleaning' }];
      const mockPatients = [{ id: 10, firstName: 'John' }];
      const mockDentists = [{ id: 20, firstName: 'Dr. Jane' }];

      vi.mocked(api.apiFetch)
        .mockResolvedValueOnce(mockAppointments)
        .mockResolvedValueOnce(mockPatients)
        .mockResolvedValueOnce(mockDentists);

      const event = createMockEvent({
        locals: {
          user: { id: 1, email: 'admin@clinic.com', token: 'mock-token' }
        }
      });

      const result = await load(event);
      expect(result).toEqual({
        appointments: mockAppointments,
        patients: mockPatients,
        dentists: mockDentists
      });
      expect(api.apiFetch).toHaveBeenNthCalledWith(1, '/api/appointments/search', {
        headers: { Authorization: 'Bearer mock-token' }
      });
    });
  });

  describe('actions.delete', () => {
    it('should delete an appointment successfully', async () => {
      const formData = new URLSearchParams();
      formData.append('id', '1');
      const request = {
        formData: vi.fn().mockResolvedValue(formData)
      };

      vi.mocked(api.apiFetch).mockResolvedValue('Appointment deleted');

      const event = createMockEvent({
        request,
        locals: {
          user: { id: 1, token: 'mock-token' }
        }
      });

      const result = await actions.delete(event);
      expect(result).toEqual({ success: true });
      expect(api.apiFetch).toHaveBeenCalledWith('/api/appointments/1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer mock-token' }
      });
    });
  });
});
