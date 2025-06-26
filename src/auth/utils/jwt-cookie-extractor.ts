import { Request } from 'express';

export function extractJwtFromCookie(req?: Request): string | null {
  if (!req || !req.cookies) return null;
  const token = req.cookies['access_token'];
  return typeof token === 'string' ? token : null;
}
