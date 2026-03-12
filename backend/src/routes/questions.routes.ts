import { Router } from 'express'
import { authMiddleware, optionalAuth } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/requireRole'
import { getQuestions, createQuestion, updateQuestion, deleteQuestion, patchQuestion } from '../controllers/questions.controller'

const router = Router()

// Public with optional auth to check admin role
router.get('/', optionalAuth, getQuestions)

// Admin-only routes
router.post('/', authMiddleware, requireRole(['admin', 'super_admin', 'teacher']), createQuestion)
router.put('/', authMiddleware, requireRole(['admin', 'super_admin', 'teacher']), updateQuestion)
router.delete('/', authMiddleware, requireRole(['admin', 'super_admin', 'teacher']), deleteQuestion)
router.patch('/', authMiddleware, requireRole(['admin', 'super_admin', 'teacher']), patchQuestion)

export default router
