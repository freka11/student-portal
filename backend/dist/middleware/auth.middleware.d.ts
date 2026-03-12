import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                uid: string;
                email: string;
                name: string;
                role: 'student' | 'admin' | 'teacher' | 'super_admin';
                publicId?: string;
                permissions: string[];
            };
        }
    }
}
/**
 * Middleware that verifies Firebase ID token from Authorization header.
 * Attaches decoded user info to req.user.
 */
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Optional auth middleware — sets req.user if token present, but doesn't block.
 */
export declare function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map