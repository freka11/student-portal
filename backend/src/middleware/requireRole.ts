import { Request, Response, NextFunction } from 'express'

/**
 * Middleware to require specific roles for access.
 */
export function requireRole(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' })
            return
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Forbidden',
                message: `Role '${req.user.role}' is not authorized. Required: ${allowedRoles.join(', ')}`,
            })
            return
        }

        next()
    }
}
