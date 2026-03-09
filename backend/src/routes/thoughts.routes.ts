import { Router } from 'express'
import { getFirestore } from '../config/firebase'

export function createThoughtsRouter() {
  const router = Router()
  const db = getFirestore()

  // GET /api/thoughts - public thoughts endpoint (mirrors Next.js API)
  router.get('/', async (req, res) => {
    try {
      const dateFilter = req.query.date as string | undefined

      let thoughtsQuery = db.collection('thoughts')
      
      if (dateFilter === 'all') {
        // Get all thoughts for history
        const snapshot = await thoughtsQuery.get()
        const thoughts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        return res.json(thoughts)
      } else {
        // Get only today's published thoughts
        const today = new Date().toISOString().split('T')[0]
        const snapshot = await thoughtsQuery
          .where('publishDate', '==', today)
          .get()
        const thoughts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        return res.json(thoughts)
      }
    } catch (error) {
      console.error('Error fetching thoughts:', error)
      return res.json([])
    }
  })

  return router
}
