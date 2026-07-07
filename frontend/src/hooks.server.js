import { redirect } from '@sveltejs/kit';
import { apiFetch, getAuthHeaders } from './lib/api.js';

const guardedPrefixes = ['/dashboard', '/patients', '/dentists', '/appointments'];

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const token = event.cookies.get('authToken');
  const isGuarded = guardedPrefixes.some(prefix => event.url.pathname.startsWith(prefix));

  if (!token) {
    event.locals.user = null;
    if (isGuarded) {
      throw redirect(303, '/login');
    }
    return resolve(event);
  }

  try {
    const user = await apiFetch('/api/auth/validate', {
      headers: getAuthHeaders(token)
    });
    
    event.locals.user = {
      ...user,
      token
    };
  } catch (error) {
    event.locals.user = null;
    
    event.cookies.delete('authToken', { path: '/' });
    event.cookies.delete('userRole', { path: '/' });
    event.cookies.delete('userEmail', { path: '/' });

    if (isGuarded) {
      throw redirect(303, '/login');
    }
  }

  return resolve(event);
}
