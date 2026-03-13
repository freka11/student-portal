"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
router.post('/admin-login', auth_controller_1.postAdminLogin);
router.post('/user-login', auth_controller_1.postUserLogin);
router.post('/session', auth_controller_1.postSession);
router.get('/session', auth_controller_1.getSession);
router.post('/verify', auth_controller_1.verifyToken);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map