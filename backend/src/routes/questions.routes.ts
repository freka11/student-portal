import { Router } from 'express'
import { getFirestore } from '../config/firebase'

export function createQuestionsRouter() {
  const router = Router()
  const db = getFirestore()

  // GET /api/questions - public questions endpoint (mirrors Next.js API)
  router.get('/', async (req, res) => {
    try {
      const dateFilter = req.query.date as string | undefined

      let questionsQuery = db.collection('questions')
      
      if (dateFilter === 'all') {
        // Get all questions for history
        const snapshot = await questionsQuery.get()
        const questions = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((q: any) => q.status === 'published' && q.deleted !== true)
        return res.json(questions)
      } else {
        // Get only today's questions
        const today = new Date().toISOString().split('T')[0]
        const snapshot = await questionsQuery
          .where('publishDate', '==', today)
          .get()
        const questions = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((q: any) => q.status === 'published' && q.deleted !== true)
        return res.json(questions)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
      return res.json([])
    }
  })

  return router
}
