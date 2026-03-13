"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.optionalAuth = optionalAuth;
const firebaseAdmin_1 = require("../config/firebaseAdmin");
function inferRoleFromEmail(email) {
    if (!email)
        return 'student';
    if (email.includes('@admin.com')) {
        if (email.includes('teacher1@admin.com') || email.includes('teacher2@admin.com')) {
            return 'super_admin';
        }
        return 'admin';
    }
    return 'student';
}
/**
 * Middleware that verifies Firebase ID token from Authorization header.
 * Attaches decoded user info to req.user.
 */
async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = await firebaseAdmin_1.adminAuth.verifyIdToken(token);
        const email = decoded.email || '';
        const uid = decoded.uid;
        // Resolve user data from Firestore
        let role = inferRoleFromEmail(email);
        let name = decoded.name || email.split('@')[0] || 'User';
        let publicId;
        try {
            const userDoc = await firebaseAdmin_1.adminFirestore.collection('users').doc(uid).get();
            const userData = userDoc.exists ? userDoc.data() : null;
            if (userData?.role) {
                role = userData.role;
            }
            if (typeof userData?.name === 'string' && userData.name.trim()) {
                name = userData.name;
            }
            if (userData?.publicId) {
                publicId = userData.publicId;
            }
        }
        catch {
            // If Firestore read fails, fall back to token/email-derived values
        }
        req.user = {
            uid,
            email,
            name,
            role: role,
            publicId,
            permissions: ['admin', 'super_admin'].includes(role)
                ? ['read', 'write', 'delete']
                : ['read', 'write'],
        };
        next();
    }
    catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
/**
 * Optional auth middleware — sets req.user if token present, but doesn't block.
 */
async function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = await firebaseAdmin_1.adminAuth.verifyIdToken(token);
        const email = decoded.email || '';
        const uid = decoded.uid;
        let role = inferRoleFromEmail(email);
        let name = decoded.name || email.split('@')[0] || 'User';
        let publicId;
        try {
            const userDoc = await firebaseAdmin_1.adminFirestore.collection('users').doc(uid).get();
            const userData = userDoc.exists ? userDoc.data() : null;
            if (userData?.role)
                role = userData.role;
            if (typeof userData?.name === 'string' && userData.name.trim())
                name = userData.name;
            if (userData?.publicId)
                publicId = userData.publicId;
        }
        catch {
            // Ignore
        }
        req.user = {
            uid,
            email,
            name,
            role: role,
            publicId,
            permissions: ['admin', 'super_admin'].includes(role)
                ? ['read', 'write', 'delete']
                : ['read', 'write'],
        };
    }
    catch {
        // Token invalid — proceed without user
    }
    next();
}
//# sourceMappingURL=auth.middleware.js.map