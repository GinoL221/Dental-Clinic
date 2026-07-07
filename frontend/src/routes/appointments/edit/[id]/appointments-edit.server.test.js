import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server.js';
import * as api from '../../../../lib/api.js';
import { createMockEvent } from '../../../../test/mockFactory.js';

vi.mock('../../../../lib/api.js', () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` }))
}));

describe('Appointments Edit Route Server Actions & Loader', () => {
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

    it('should load appointment, patients, and dentists lists if authenticated', async () => {
      const mockAppointment = { id: 1, patient_id: 10, dentist_id: 20, date: '2026-07-07', time: '10:00', description: 'Checkup' };
      const mockPatients = [{ id: 10, firstName: 'John' }];
      const mockDentists = [{ id: 20, firstName: 'Dr. Jane' }];

      vi.mocked(api.apiFetch)
        .mockResolvedValueOnce(mockAppointment)
        .mockResolvedValueOnce(mockPatients)
        .mockResolvedValueOnce(mockDentists);

      const event = createMockEvent({
        params: { id: '1' },
        locals: { user: { id: 1, token: 'mock-token' } }
      });

      const result = await load(event);
      expect(result).toEqual({
        appointment: mockAppointment,
        patients: mockPatients,
        dentists: mockDentists
      });

      expect(api.apiFetch).toHaveBeenNthCalledWith(1, '/api/appointments/1', {
        headers: { Authorization: 'Bearer mock-token' }
      });
    });
  });

  describe('actions.default', () => {
    it('should update appointment successfully and redirect to /appointments', async () => {
      const formData = new URLSearchParams();
      formData.append('patientId', '1');
      formData.append('dentistId', '2');
      formData.append('appointmentDate', '2026-07-07');
      formData.append('appointmentTime', '10:00');
      formData.append('description', 'Routine Checkup');

      const request = {
        formData: vi.fn().mockResolvedValue(formData)
      };

      vi.mocked(api.apiFetch).mockResolvedValue({ id: 1 });

      const event = createMockEvent({
        params: { id: '1' },
        request,
        locals: { user: { id: 1, token: 'mock-token' } }
      });

      await expect(actions.default(event)).rejects.toMatchObject({
        status: 303,
        location: '/appointments'
      });

      expect(api.apiFetch).toHaveBeenCalledWith('/api/appointments/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token'
        },
        body: JSON.stringify({
          patientId: 1,
          dentistId: 2,
          date: '2026-07-07',
          time: '10:00',
          description: 'Routine Checkup'
        })
      });
    });
  });
});
