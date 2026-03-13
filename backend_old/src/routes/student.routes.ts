import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken'
import { requireRole } from '../middleware/requireRole'
import { ThoughtService } from '../modules/thoughts/thought.service'
import { QuestionService } from '../modules/questions/question.service'

export function createStudentRouter() {
  const router = Router()

  router.use(verifyFirebaseToken)
  router.use(requireRole(['student']))

  router.get('/though', async (_req, res) => {
    const today = new Date().toISOString().split('T')[0]
    const thoughts = await  ThoughtService.listByPublishDate(today)
    res.json({ success: true, today, thought: thoughts[0] ?? null })
  })

  router.get('/questions', async (_req, res) => {
    const today = new Date().toISOString().split('T')[0]
    const questions = await new QuestionService().listByPublishDate(today)
    res.json({ success: true, today, questions })
  })

  return router
}

