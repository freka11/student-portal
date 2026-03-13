import { Request, Response } from 'express'
import { adminFirestore } from '../config/firebaseAdmin'

// ─── GET /api/questions ─────────────────────────────────────────────
export async function getQuestions(req: Request, res: Response) {
    try {
        const dateFilter = req.query.date as string | undefined
        const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin' || req.user?.role === 'teacher'

        const questionsQuery = adminFirestore.collection('questions')

        if (dateFilter === 'all') {
            const snapshot = await questionsQuery.get()
            const questions = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((q: any) => isAdmin ? q.deleted !== true : (q.status === 'published' && q.deleted !== true))
            res.json(questions)
        } else {
            const today = new Date().toISOString().split('T')[0]
            const snapshot = await questionsQuery
                .where('publishDate', '==', today)
                .get()
            const questions = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((q: any) => isAdmin ? q.deleted !== true : (q.status === 'published' && q.deleted !== true))
            res.json(questions)
        }
    } catch (error) {
        console.error('Error fetching questions:', error)
        res.status(500).json([])
    }
}

// ─── POST /api/questions (admin auth required) ─────────────────────
export async function createQuestion(req: Request, res: Response) {
    try {
        const questionText = (req.body?.text as string) ?? (req.body?.question as string)
        const requestedStatus = req.body?.status as string | undefined

        if (!questionText || questionText.trim() === '') {
            res.status(400).json({ success: false, message: 'Question text is required' })
            return
        }

        const user = req.user!

        const questionDoc = {
            text: questionText.trim(),
            status: requestedStatus === 'draft' ? 'draft' : 'published',
            deleted: false,
            createdBy: {
                uid: user.uid,
                name: user.name,
            },
            createdAt: new Date().toISOString(),
            publishDate: new Date().toISOString().split('T')[0],
        }

        const docRef = await adminFirestore.collection('questions').add(questionDoc)

        res.status(201).json({
            success: true,
            message: 'Question saved successfully',
            data: { id: docRef.id, ...questionDoc },
        })
    } catch (error) {
        console.error('Error saving question:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to save question',
            error: error instanceof Error ? error.message : 'Unknown error',
        })
    }
}

// ─── PUT /api/questions?id=xxx ──────────────────────────────────────
export async function updateQuestion(req: Request, res: Response) {
    try {
        const questionId = (req.query.id as string) || (req.body?.id as string)
        const { text } = req.body

        if (!questionId) {
            res.status(400).json({ success: false, message: 'Question ID is required' })
            return
        }

        if (!text || text.trim() === '') {
            res.status(400).json({ success: false, message: 'Question text is required' })
            return
        }

        await adminFirestore.collection('questions').doc(questionId).update({
            text: text.trim(),
            updatedAt: new Date().toISOString(),
        })

        res.json({ success: true, message: 'Question updated successfully' })
    } catch (error) {
        console.error('Error updating question:', error)
        res.status(500).json({ success: false, message: 'Failed to update question' })
    }
}

// ─── DELETE /api/questions?id=xxx ───────────────────────────────────
export async function deleteQuestion(req: Request, res: Response) {
    try {
        const questionId = (req.query.id as string) || (req.body?.id as string)

        if (!questionId) {
            res.status(400).json({ success: false, message: 'Question ID is required' })
            return
        }

        await adminFirestore.collection('questions').doc(questionId).update({
            deleted: true,
            updatedAt: new Date().toISOString(),
        })

        res.json({ success: true, message: 'Question deleted successfully' })
    } catch (error) {
        console.error('Error deleting question:', error)
        res.status(500).json({ success: false, message: 'Failed to delete question' })
    }
}

// ─── PATCH /api/questions?id=xxx ────────────────────────────────────
export async function patchQuestion(req: Request, res: Response) {
    try {
        const questionId = (req.query.id as string) || (req.body?.id as string)
        const updates = req.body

        if (!questionId) {
            res.status(400).json({ success: false, message: 'Question ID is required' })
            return
        }

        const allowedFields = ['text', 'status', 'deleted', 'publishDate']
        const sanitizedUpdates: any = {}

        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                sanitizedUpdates[key] = updates[key]
            }
        }

        sanitizedUpdates.updatedAt = new Date().toISOString()

        await adminFirestore.collection('questions').doc(questionId).update(sanitizedUpdates)

        res.json({ success: true, message: 'Question updated successfully' })
    } catch (error) {
        console.error('Error patching question:', error)
        res.status(500).json({ success: false, message: 'Failed to update question' })
    }
}
