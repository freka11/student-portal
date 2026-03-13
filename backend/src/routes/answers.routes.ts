import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/requireRole'
import { getAnswersAdmin, deleteAnswerAdmin, getStudentAnswers, submitAnswer } from '../controllers/answers.controller'

const router = Router()

// Admin routes — /api/answers
router.get('/', authMiddleware, requireRole(['admin', 'super_admin', 'teacher']), getAnswersAdmin)
router.delete('/', authMiddleware, requireRole(['admin', 'super_admin', 'teacher']), deleteAnswerAdmin)

// Student posting answer
router.post('/', authMiddleware, submitAnswer)

// Student routes — /api/student/answers (mounted separately in server.ts)
export const studentAnswersRouter = Router()
studentAnswersRouter.get('/', authMiddleware, getStudentAnswers)
studentAnswersRouter.post('/', authMiddleware, submitAnswer)

export default router
