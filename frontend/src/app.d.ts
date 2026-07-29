// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        role: 'ADMIN' | 'PATIENT' | 'DENTIST';
      } | null;
      // Server-only JWT. Never returned by a load function or serialized to PageData.
      authToken: string | null;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
