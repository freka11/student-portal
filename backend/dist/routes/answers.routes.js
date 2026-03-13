"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentAnswersRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const requireRole_1 = require("../middleware/requireRole");
const answers_controller_1 = require("../controllers/answers.controller");
const router = (0, express_1.Router)();
// Admin routes — /api/answers
router.get('/', auth_middleware_1.authMiddleware, (0, requireRole_1.requireRole)(['admin', 'super_admin']), answers_controller_1.getAnswersAdmin);
router.delete('/', auth_middleware_1.authMiddleware, (0, requireRole_1.requireRole)(['admin', 'super_admin']), answers_controller_1.deleteAnswerAdmin);
// Student posting answer
router.post('/', auth_middleware_1.authMiddleware, answers_controller_1.submitAnswer);
// Student routes — /api/student/answers (mounted separately in server.ts)
exports.studentAnswersRouter = (0, express_1.Router)();
exports.studentAnswersRouter.get('/', auth_middleware_1.authMiddleware, answers_controller_1.getStudentAnswers);
exports.studentAnswersRouter.post('/', auth_middleware_1.authMiddleware, answers_controller_1.submitAnswer);
exports.default = router;
//# sourceMappingURL=answers.routes.js.map