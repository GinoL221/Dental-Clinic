import { describe, it, expect, vi } from 'vitest';
import { getAuthHeaders, apiFetch } from './api.js';

describe('API Client Wrapper', () => {
  it('generates Authorization headers', () => {
    expect(getAuthHeaders('test-token')).toEqual({ Authorization: 'Bearer test-token' });
  });

  it('fetches JSON data from the backend URL', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('{"success":true}', {
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(apiFetch('/api/test')).resolves.toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/api/test', {});
  });

  it('parses mixed-case JSON media types as JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('{"ok":true}', {
        headers: { 'Content-Type': 'Application/JSON' },
      }),
    );

    await expect(apiFetch('/api/test')).resolves.toEqual({ ok: true });
  });

  it('parses application/problem+json success responses as JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('{"ok":true}', {
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    );

    await expect(apiFetch('/api/test')).resolves.toEqual({ ok: true });
  });

  it.each([200, 204])('returns null for an empty %i response', async (status) => {
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status }));

    await expect(apiFetch('/api/test')).resolves.toBeNull();
  });

  it('returns successful plain-text responses unchanged', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('Updated', {
        headers: { 'Content-Type': 'text/plain' },
      }),
    );

    await expect(apiFetch('/api/test')).resolves.toBe('Updated');
  });

  it('uses the plain-text error body as the error message and preserves response metadata', async () => {
    const response = new Response('Invalid input', {
      status: 422,
      headers: { 'Content-Type': 'text/plain' },
    });
    global.fetch = vi.fn().mockResolvedValue(response);

    await expect(apiFetch('/api/test')).rejects.toMatchObject({
      message: 'Invalid input',
      status: 422,
      response,
    });
  });

  it('uses JSON error messages and preserves response metadata', async () => {
    const response = new Response('{"message":"Not allowed"}', {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
    global.fetch = vi.fn().mockResolvedValue(response);

    await expect(apiFetch('/api/test')).rejects.toMatchObject({
      message: 'Not allowed',
      status: 403,
      response,
    });
  });

  it('preserves metadata for null JSON HTTP error bodies', async () => {
    const response = new Response('null', {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
    global.fetch = vi.fn().mockResolvedValue(response);

    await expect(apiFetch('/api/test')).rejects.toMatchObject({
      message: 'HTTP error! status: 400',
      status: 400,
      response,
    });
  });

  it('preserves metadata for malformed JSON HTTP error bodies', async () => {
    const response = new Response('{invalid', {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
    global.fetch = vi.fn().mockResolvedValue(response);

    await expect(apiFetch('/api/test')).rejects.toMatchObject({
      message: 'HTTP error! status: 500',
      status: 500,
      response,
    });
  });

  it('uses the status fallback when a JSON error message is not a string', async () => {
    const response = new Response('{"message":{"detail":"invalid"}}', {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
    global.fetch = vi.fn().mockResolvedValue(response);

    await expect(apiFetch('/api/test')).rejects.toMatchObject({
      message: 'HTTP error! status: 400',
      status: 400,
      response,
    });
  });

  it('rejects malformed bodies declared as JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('{invalid', {
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(apiFetch('/api/test')).rejects.toThrow(SyntaxError);
  });

  it('rejects network failures unchanged', async () => {
    const failure = new TypeError('Network unavailable');
    global.fetch = vi.fn().mockRejectedValue(failure);

    await expect(apiFetch('/api/test')).rejects.toBe(failure);
  });
});
