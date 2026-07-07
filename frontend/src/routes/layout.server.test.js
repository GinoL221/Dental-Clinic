import { describe, it, expect } from 'vitest';
import { load } from './+layout.server.js';
import { createMockEvent } from '../test/mockFactory.js';

describe('Layout Server Loader', () => {
  it('should return user from event.locals', () => {
    const event = createMockEvent({
      locals: {
        user: {
          id: 1,
          email: 'admin@clinic.com',
          role: 'ADMIN'
        }
      }
    });
    const result = load(event);
    expect(result).toEqual({
      user: {
        id: 1,
        email: 'admin@clinic.com',
        role: 'ADMIN'
      }
    });
  });

  it('should return null user if not authenticated', () => {
    const event = createMockEvent({
      locals: {}
    });
    const result = load(event);
    expect(result).toEqual({ user: undefined });
  });
});
