import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/requireRole'
import { getThoughts, createThought, deleteThought } from '../controllers/thoughts.controller'

const router = Router()

// Public — no auth required
router.get('/', getThoughts)

// Admin-only routes
router.post('/', authMiddleware, requireRole(['admin', 'super_admin', 'teacher']), createThought)
router.delete('/', authMiddleware, requireRole(['admin', 'super_admin', 'teacher']), deleteThought)

export default router
