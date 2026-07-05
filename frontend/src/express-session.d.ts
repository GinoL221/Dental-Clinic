import 'express-session';
import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    session: any;
  }
}

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      token: string;
    };
  }
}

declare global {
  interface Window {
    __ENV__?: {
      API_BASE_URL?: string;
    };
  }
}
