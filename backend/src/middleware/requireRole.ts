import type { Request, Response, NextFunction } from 'express'

export function requireRole(allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ success: false, message: 'Forbidden', role })
    }
    return next()
  }
}

