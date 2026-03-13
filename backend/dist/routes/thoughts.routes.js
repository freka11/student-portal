"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const requireRole_1 = require("../middleware/requireRole");
const thoughts_controller_1 = require("../controllers/thoughts.controller");
const router = (0, express_1.Router)();
// Public — no auth required
router.get('/', thoughts_controller_1.getThoughts);
// Admin-only routes
router.post('/', auth_middleware_1.authMiddleware, (0, requireRole_1.requireRole)(['admin', 'super_admin']), thoughts_controller_1.createThought);
router.delete('/', auth_middleware_1.authMiddleware, (0, requireRole_1.requireRole)(['admin', 'super_admin']), thoughts_controller_1.deleteThought);
exports.default = router;
//# sourceMappingURL=thoughts.routes.js.map