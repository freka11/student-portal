"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const requireRole_1 = require("../middleware/requireRole");
const admin_controller_1 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
// All admin routes require admin/super_admin auth
router.use(auth_middleware_1.authMiddleware);
router.use((0, requireRole_1.requireRole)(['admin', 'super_admin']));
// User management
router.get('/users', admin_controller_1.listUsers);
router.post('/create-teacher', admin_controller_1.createTeacher);
router.post('/create-superadmin', admin_controller_1.createSuperadmin);
router.get('/superadmins', admin_controller_1.getSuperadmins);
router.post('/create-direct-superadmin', admin_controller_1.createDirectSuperadmin);
router.post('/promote-to-superadmin', admin_controller_1.promoteToSuperadmin);
router.post('/transition-roles', admin_controller_1.transitionRoles);
router.get('/role-distribution', admin_controller_1.getRoleDistribution);
// Conversations
router.post('/assign-conversation', admin_controller_1.assignConversation);
router.post('/clean-conversations', admin_controller_1.cleanConversations);
router.get('/conversation-status', admin_controller_1.getConversationStatus);
// Public IDs
router.post('/backfill-public-ids', admin_controller_1.backfillPublicIds);
router.get('/public-id-status', admin_controller_1.getPublicIdStatus);
// Setup & utilities
router.post('/setup-counters', admin_controller_1.setupCounters);
router.get('/counters', admin_controller_1.getCounters);
router.post('/setup-users', admin_controller_1.setupUsers);
router.get('/setup-info', admin_controller_1.getSetupInfo);
router.post('/setup-collections', admin_controller_1.setupCollections);
router.get('/test-users', admin_controller_1.getTestUsers);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map