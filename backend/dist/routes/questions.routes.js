"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const requireRole_1 = require("../middleware/requireRole");
const questions_controller_1 = require("../controllers/questions.controller");
const router = (0, express_1.Router)();
// Public with optional auth to check admin role
router.get('/', auth_middleware_1.optionalAuth, questions_controller_1.getQuestions);
// Admin-only routes
router.post('/', auth_middleware_1.authMiddleware, (0, requireRole_1.requireRole)(['admin', 'super_admin']), questions_controller_1.createQuestion);
router.put('/', auth_middleware_1.authMiddleware, (0, requireRole_1.requireRole)(['admin', 'super_admin']), questions_controller_1.updateQuestion);
router.delete('/', auth_middleware_1.authMiddleware, (0, requireRole_1.requireRole)(['admin', 'super_admin']), questions_controller_1.deleteQuestion);
router.patch('/', auth_middleware_1.authMiddleware, (0, requireRole_1.requireRole)(['admin', 'super_admin']), questions_controller_1.patchQuestion);
exports.default = router;
//# sourceMappingURL=questions.routes.js.map