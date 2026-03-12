import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to require specific roles for access.
 */
export declare function requireRole(allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=requireRole.d.ts.map