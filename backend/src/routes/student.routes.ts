import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken'
import { requireRole } from '../middleware/requireRole'
import { ThoughtService } from '../modules/thoughts/thought.service'
import { QuestionService } from '../modules/questions/question.service'
import { AnswerService, StreakService } from '../modules/answers/answer.service'

export function createStudentRouter() {
  const router = Router()
  const answerService = new AnswerService()
  const streakService = new StreakService()

  // Public thoughts endpoint - mirrors student-user /api/thoughts
  router.get('/thoughts', async (req, res, next) => {
    try {
      const dateFilter = req.query.date as string | undefined

      if (dateFilter === 'all') {
        const thoughts = await ThoughtService.listAll()
        return res.json(thoughts)
      }

      const today = new Date().toISOString().split('T')[0]
      const thoughts = await ThoughtService.listByPublishDate(today)
      res.json(thoughts)
    } catch (error) {
      next(error)
    }
  })

  // Public questions endpoint - mirrors student-user /api/questions
  router.get('/questions', async (req, res, next) => {
    try {
      const dateFilter = req.query.date as string | undefined
      const service = new QuestionService()

      let questions =
        dateFilter === 'all'
          ? await service.listAll()
          : await service.listByPublishDate(new Date().toISOString().split('T')[0])

      // Only published and not deleted for student view
      questions = questions.filter((q: any) => q.status === 'published' && q.deleted !== true)

      res.json(questions)
    } catch (error) {
      next(error)
    }
  })

  // ANSWERS - requires student auth (mirrors student-user /api/answers)
  router.get(
    '/answers',
    verifyFirebaseToken,
    requireRole(['student']),
    async (req, res, next) => {
      try {
        const all = req.query.all === 'true'

        if (all) {
          const answers = await answerService.listAll()
          return res.json(answers)
        }

        const answers = await answerService.listByStudentId(req.user!.uid)
        res.json(answers)
      } catch (error) {
        next(error)
      }
    }
  )

  router.post(
    '/answers',
    verifyFirebaseToken,
    requireRole(['student']),
    async (req, res, next) => {
      try {
        const { questionId, answer, publishDate } = req.body

        if (!questionId || !answer) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: questionId, answer',
          })
        }

        const isValid = await answerService.validateQuestionForAnswer(questionId)
        if (!isValid) {
          return res.status(400).json({
            success: false,
            message: 'Question is not available for answering',
          })
        }

        const result = await answerService.create({
          studentId: req.user!.uid,
          studentName: req.user!.name,
          questionId,
          answer: String(answer),
          publishDate,
        })

        res.status(201).json({
          success: true,
          message: 'Answer submitted successfully',
          id: result.id,
          streak: result.streak,
        })
      } catch (error) {
        next(error)
      }
    }
  )

  // STREAK - requires student auth (mirrors student-user /api/streak)
  router.get(
    '/streak',
    verifyFirebaseToken,
    requireRole(['student']),
    async (req, res, next) => {
      try {
        const streak = await streakService.getForStudent(
          req.user!.uid,
          req.user!.name
        )
        res.json({
          success: true,
          streak: {
            studentId: req.user!.uid,
            studentName: req.user!.name,
            streakCount: streak.streakCount,
            lastAnsweredDate: streak.lastAnsweredDate,
          },
        })
      } catch (error) {
        next(error)
      }
    }
  )

  return router
}

