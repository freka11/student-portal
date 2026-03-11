import { Request, Response } from 'express'
import { adminFirestore } from '../config/firebaseAdmin'

function toDateKey(date: Date): string {
    return date.toISOString().split('T')[0]
}

function addDays(dateKey: string, days: number): string {
    const [y, m, d] = dateKey.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    dt.setUTCDate(dt.getUTCDate() + days)
    return toDateKey(dt)
}

// ─── GET /api/answers (admin — all answers) ─────────────────────────
export async function getAnswersAdmin(req: Request, res: Response) {
    try {
        const snapshot = await adminFirestore.collection('answers').get()
        const answers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        res.json(answers)
    } catch (error) {
        console.error('Error reading answers:', error)
        res.status(500).json([])
    }
}

// ─── DELETE /api/answers?id=xxx (admin) ─────────────────────────────
export async function deleteAnswerAdmin(req: Request, res: Response) {
    try {
        const answerId = req.query.id as string

        if (!answerId) {
            res.status(400).json({ success: false, message: 'Answer ID is required' })
            return
        }

        await adminFirestore.collection('answers').doc(answerId).delete()

        res.json({ success: true, message: 'Answer deleted successfully' })
    } catch (error) {
        console.error('Error deleting answer:', error)
        res.status(500).json({ success: false, message: 'Failed to delete answer' })
    }
}

// ─── GET /api/student/answers (student auth) ────────────────────────
export async function getStudentAnswers(req: Request, res: Response) {
    try {
        const user = req.user!
        const all = req.query.all === 'true'

        if (all) {
            const snapshot = await adminFirestore
                .collection('answers')
                .orderBy('submittedAt', 'desc')
                .get()
            const answers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            res.json(answers)
            return
        }

        // Fetch only current student's answers
        const snapshot = await adminFirestore
            .collection('answers')
            .where('studentId', '==', user.uid)
            .get()

        const answers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        res.json(answers)
    } catch (error) {
        console.error('Error fetching answers:', error)
        res.status(500).json([])
    }
}

// ─── POST /api/student/answers (student auth) ──────────────────────
export async function submitAnswer(req: Request, res: Response) {
    try {
        const user = req.user!
        const answerData = req.body

        if (!answerData.questionId || !answerData.answer) {
            res.status(400).json({ success: false, message: 'Missing required fields: questionId, answer' })
            return
        }

        // Validate question exists and is published
        const questionSnap = await adminFirestore.collection('questions').doc(answerData.questionId).get()
        const question = questionSnap.exists ? (questionSnap.data() as any) : null
        const isDeleted = question?.deleted === true
        const status = typeof question?.status === 'string' ? question.status : null

        if (!question || isDeleted || status !== 'published') {
            res.status(400).json({ success: false, message: 'Question is not available for answering' })
            return
        }

        // Check if user already answered this question
        const existingAnswerSnap = await adminFirestore
            .collection('answers')
            .where('studentId', '==', user.uid)
            .where('questionId', '==', answerData.questionId)
            .get()

        if (!existingAnswerSnap.empty) {
            res.status(409).json({ success: false, message: 'You have already answered this question.' })
            return
        }

        // Create answer document
        const answerDoc = {
            studentId: user.uid,
            studentName: user.name,
            questionId: answerData.questionId,
            answer: answerData.answer,
            submittedAt: new Date().toISOString(),
            publishDate: answerData.publishDate || new Date().toISOString().split('T')[0],
        }

        const docRef = await adminFirestore.collection('answers').add(answerDoc)

        // Update streak counter transactionally
        const todayKey = toDateKey(new Date())
        const yesterdayKey = addDays(todayKey, -1)
        const streakRef = adminFirestore.collection('streak').doc(user.uid)

        const streakResult = await adminFirestore.runTransaction(async (tx) => {
            const snap = await tx.get(streakRef)
            const existing = snap.exists ? (snap.data() as any) : null

            const lastAnsweredDate: string | null =
                typeof existing?.lastAnsweredDate === 'string' ? existing.lastAnsweredDate : null
            const prevCount: number =
                typeof existing?.streakCount === 'number' && Number.isFinite(existing.streakCount)
                    ? existing.streakCount
                    : 0

            let nextCount = prevCount
            let nextLast = lastAnsweredDate

            if (lastAnsweredDate === todayKey) {
                nextCount = prevCount
                nextLast = lastAnsweredDate
            } else if (lastAnsweredDate === yesterdayKey) {
                nextCount = prevCount + 1
                nextLast = todayKey
            } else {
                nextCount = 1
                nextLast = todayKey
            }

            tx.set(
                streakRef,
                {
                    studentId: user.uid,
                    studentName: user.name,
                    streakCount: nextCount,
                    lastAnsweredDate: nextLast,
                },
                { merge: true }
            )

            return { streakCount: nextCount, lastAnsweredDate: nextLast }
        })

        res.status(201).json({
            success: true,
            message: 'Answer submitted successfully',
            id: docRef.id,
            streak: streakResult,
        })
    } catch (error) {
        console.error('Error saving answer:', error)
        res.status(500).json({ success: false, message: 'Failed to submit answer' })
    }
}
