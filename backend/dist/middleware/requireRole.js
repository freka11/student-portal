"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
/**
 * Middleware to require specific roles for access.
 */
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Forbidden',
                message: `Role '${req.user.role}' is not authorized. Required: ${allowedRoles.join(', ')}`,
            });
            return;
        }
        next();
    };
}
//# sourceMappingURL=requireRole.js.map