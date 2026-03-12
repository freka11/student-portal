"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const streak_controller_1 = require("../controllers/streak.controller");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authMiddleware, streak_controller_1.getStreak);
exports.default = router;
//# sourceMappingURL=streak.routes.js.map