import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/requireRole'
import {
    listUsers, createTeacher, createSuperadmin, getSuperadmins,
    createDirectSuperadmin, promoteToSuperadmin, transitionRoles,
    getRoleDistribution, assignConversation, backfillPublicIds,
    getPublicIdStatus, cleanConversations, getConversationStatus,
    setupCounters, getCounters, setupUsers, getSetupInfo,
    setupCollections, getTestUsers,
} from '../controllers/admin.controller'

const router = Router()

// All admin routes require admin/super_admin auth
router.use(authMiddleware)
router.use(requireRole(['admin', 'super_admin']))

// User management
router.get('/users', listUsers)
router.post('/create-teacher', createTeacher)
router.post('/create-superadmin', createSuperadmin)
router.get('/superadmins', getSuperadmins)
router.post('/create-direct-superadmin', createDirectSuperadmin)
router.post('/promote-to-superadmin', promoteToSuperadmin)
router.post('/transition-roles', transitionRoles)
router.get('/role-distribution', getRoleDistribution)

// Conversations
router.post('/assign-conversation', assignConversation)
router.post('/clean-conversations', cleanConversations)
router.get('/conversation-status', getConversationStatus)

// Public IDs
router.post('/backfill-public-ids', backfillPublicIds)
router.get('/public-id-status', getPublicIdStatus)

// Setup & utilities
router.post('/setup-counters', setupCounters)
router.get('/counters', getCounters)
router.post('/setup-users', setupUsers)
router.get('/setup-info', getSetupInfo)
router.post('/setup-collections', setupCollections)
router.get('/test-users', getTestUsers)

export default router
