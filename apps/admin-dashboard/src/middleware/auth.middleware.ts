// apps/admin-dashboard/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Placeholder middleware for admin authentication.
 * In a real-world scenario, this would validate a JWT, check the user's role
 * from the database, and ensure they are an 'admin'.
 *
 * For this design, it simply checks for a specific 'X-Admin-Auth' header.
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const adminHeader = req.headers['x-admin-auth'];

  if (adminHeader === 'super-secret-key') {
    // In a real app, you would attach the admin user object to the request.
    // (req as any).admin = { id: 'admin-user-id', email: 'admin@example.com' };
    return next();
  }

  res.status(403).json({ error: 'Forbidden: Administrator access required.' });
};
