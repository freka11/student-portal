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

// ─── GET /api/student/streak ────────────────────────────────────────
export async function getStreak(req: Request, res: Response) {
    try {
        const user = req.user!

        const questionsSnap = await adminFirestore
            .collection('questions')
            .where('status', '==', 'published')
            .get()

        const validQuestionIds = new Set<string>()
        for (const doc of questionsSnap.docs) {
            const q = doc.data() as any
            if (q?.deleted === true) continue
            validQuestionIds.add(doc.id)
        }

        const answersSnap = await adminFirestore
            .collection('answers')
            .where('studentId', '==', user.uid)
            .get()

        const answeredDays = new Set<string>()
        for (const doc of answersSnap.docs) {
            const ans = doc.data() as any
            const questionId = typeof ans?.questionId === 'string' ? ans.questionId : null
            if (!questionId || !validQuestionIds.has(questionId)) continue

            const submittedAt = typeof ans?.submittedAt === 'string' ? ans.submittedAt : null
            const publishDate = typeof ans?.publishDate === 'string' ? ans.publishDate : null
            const dayKey = submittedAt ? submittedAt.split('T')[0] : publishDate
            if (dayKey) answeredDays.add(dayKey)
        }

        const sortedDays = Array.from(answeredDays).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
        const lastAnsweredDate = sortedDays.length > 0 ? sortedDays[0] : null

        let streakCount = 0
        if (lastAnsweredDate) {
            streakCount = 1
            let cursor = lastAnsweredDate
            while (true) {
                const prev = addDays(cursor, -1)
                if (!answeredDays.has(prev)) break
                streakCount += 1
                cursor = prev
            }
        }

        await adminFirestore
            .collection('streak')
            .doc(user.uid)
            .set(
                {
                    studentId: user.uid,
                    studentName: user.name,
                    streakCount,
                    lastAnsweredDate,
                },
                { merge: true }
            )

        res.json({
            success: true,
            streak: {
                studentId: user.uid,
                studentName: user.name,
                streakCount,
                lastAnsweredDate,
            },
        })
    } catch (error) {
        console.error('Error fetching streak:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch streak' })
    }
}
