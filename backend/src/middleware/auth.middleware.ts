import type { NextFunction, Request, Response } from 'express';
import { roleFromLoginId } from '../utils/access.js';
import { HttpError } from '../utils/http.js';
import { getCurrentSession, type CurrentSession } from '../utils/session.js';

// Logged-in account for the request, stored by requireSession / requireOwner.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      session?: CurrentSession;
    }
  }
}

// Only lets the request through when the session cookie belongs to an active account.
export const requireSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await getCurrentSession(req);
  if (!session) throw new HttpError(401, 'Sesi berakhir. Silakan login ulang.');
  res.locals.session = session;
  next();
};

// Like requireSession, but only for the Owner (login ID OWN-xxx).
export const requireOwner =
  (message = 'Hanya Owner yang boleh mengakses fitur ini.') =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const session = await getCurrentSession(req);
    if (!session) throw new HttpError(401, 'Sesi berakhir. Silakan login ulang.');
    // Set before the role check so a refused request is still logged with who tried it.
    res.locals.session = session;
    if (roleFromLoginId(session.account.login_id) !== 'superadmin') throw new HttpError(403, message);
    next();
  };

// Session set by one of the middlewares above (controllers behind them can rely on it).
export const sessionOf = (res: Response): CurrentSession => {
  const session = res.locals.session;
  if (!session) throw new HttpError(401, 'Sesi berakhir. Silakan login ulang.');
  return session;
};

export const isOwner = (session: CurrentSession): boolean => roleFromLoginId(session.account.login_id) === 'superadmin';
