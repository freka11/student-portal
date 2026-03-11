import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { getStreak } from '../controllers/streak.controller'

const router = Router()

router.get('/', authMiddleware, getStreak)

export default router
