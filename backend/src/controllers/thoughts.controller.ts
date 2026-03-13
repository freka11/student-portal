import { Request, Response } from 'express'
import { adminFirestore } from '../config/firebaseAdmin'

// ─── GET /api/thoughts ─────────────────────────────────────────────
export async function getThoughts(req: Request, res: Response) {
    try {
        const dateFilter = req.query.date as string | undefined

        const thoughtsQuery = adminFirestore.collection('thoughts')

        if (dateFilter === 'all') {
            const snapshot = await thoughtsQuery.get()
            const thoughts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            res.json(thoughts)
        } else {
            const today = new Date().toISOString().split('T')[0]
            const snapshot = await thoughtsQuery
                .where('publishDate', '==', today)
                .get()
            const thoughts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            res.json(thoughts)
        }
    } catch (error) {
        console.error('Error fetching thoughts:', error)
        res.status(500).json([])
    }
}

// ─── POST /api/thoughts (admin auth required) ──────────────────────
export async function createThought(req: Request, res: Response) {
    try {
        const { thought } = req.body

        if (!thought || thought.trim() === '') {
            res.status(400).json({ success: false, message: 'Thought text is required' })
            return
        }

        const user = req.user!

        const today = new Date().toISOString().split('T')[0]
        
        // Check if a thought already exists for today
        const existingThoughtSnap = await adminFirestore
            .collection('thoughts')
            .where('publishDate', '==', today)
            .get()

        if (!existingThoughtSnap.empty) {
            // Update the existing thought
            const existingDocId = existingThoughtSnap.docs[0].id
            await adminFirestore.collection('thoughts').doc(existingDocId).update({
                text: thought,
                updatedAt: new Date().toISOString(),
                updatedBy: {
                    uid: user.uid,
                    name: user.name,
                }
            })

            res.status(200).json({
                success: true,
                message: 'Thought updated successfully',
                id: existingDocId,
            })
            return
        }

        const thoughtDoc = {
            text: thought,
            status: 'published',
            createdBy: {
                uid: user.uid,
                name: user.name,
            },
            createdAt: new Date().toISOString(),
            publishDate: today,
        }

        const docRef = await adminFirestore.collection('thoughts').add(thoughtDoc)

        res.status(201).json({
            success: true,
            message: 'Thought saved successfully',
            id: docRef.id,
        })
    } catch (error) {
        console.error('Error saving thought:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to save thought',
            error: error instanceof Error ? error.message : 'Unknown error',
        })
    }
}

// ─── DELETE /api/thoughts?id=xxx ────────────────────────────────────
export async function deleteThought(req: Request, res: Response) {
    try {
        const thoughtId = req.query.id as string

        if (!thoughtId) {
            res.status(400).json({ success: false, message: 'Thought ID is required' })
            return
        }

        await adminFirestore.collection('thoughts').doc(thoughtId).delete()

        res.json({ success: true, message: 'Thought deleted successfully' })
    } catch (error) {
        console.error('Error deleting thought:', error)
        res.status(500).json({ success: false, message: 'Failed to delete thought' })
    }
}
