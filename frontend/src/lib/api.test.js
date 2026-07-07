import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthHeaders, apiFetch } from './api.js';

describe('API Client Wrapper', () => {
  it('should generate correct Authorization headers', () => {
    const headers = getAuthHeaders('test-token');
    expect(headers).toEqual({ Authorization: 'Bearer test-token' });
  });

  it('should fetch data from backend URL', async () => {
    // Mock global fetch
    const mockResponse = { ok: true, json: async () => ({ success: true }) };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await apiFetch('/api/test');
    
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/api/test', {});
    expect(result).toEqual({ success: true });
  });
});
