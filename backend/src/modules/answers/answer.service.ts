import { getFirestore } from '../../config/firebase'

const db = getFirestore()
const answersCollection = db.collection('answers')
const questionsCollection = db.collection('questions')
const streakCollection = db.collection('streak')

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return toDateKey(dt)
}

export type AnswerDoc = {
  id: string
  studentId: string
  studentName?: string
  questionId: string
  answer: string
  submittedAt: string
  publishDate?: string
}

export type StreakResult = {
  streakCount: number
  lastAnsweredDate: string | null
}

export class AnswerService {
  async listAll(): Promise<AnswerDoc[]> {
    const snapshot = await answersCollection.orderBy('submittedAt', 'desc').get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnswerDoc))
  }

  async listByStudentId(studentId: string): Promise<AnswerDoc[]> {
    const snapshot = await answersCollection
      .where('studentId', '==', studentId)
      .get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnswerDoc))
  }

  async create(data: {
    studentId: string
    studentName: string
    questionId: string
    answer: string
    publishDate?: string
  }): Promise<{ id: string; streak: StreakResult }> {
    const publishDate = data.publishDate ?? toDateKey(new Date())
    const submittedAt = new Date().toISOString()

    const answerDoc = {
      studentId: data.studentId,
      studentName: data.studentName,
      questionId: data.questionId,
      answer: data.answer,
      submittedAt,
      publishDate,
    }

    const docRef = await answersCollection.add(answerDoc)

    const todayKey = toDateKey(new Date())
    const yesterdayKey = addDays(todayKey, -1)
    const streakRef = streakCollection.doc(data.studentId)

    const streakResult = await db.runTransaction(async tx => {
      const snap = await tx.get(streakRef)
      const existing = snap.exists ? (snap.data() as any) : null

      const lastAnsweredDate: string | null =
        typeof existing?.lastAnsweredDate === 'string' ? existing.lastAnsweredDate : null
      const prevCount: number =
        typeof existing?.streakCount === 'number' && Number.isFinite(existing.streakCount)
          ? existing.streakCount
          : 0

      let nextCount: number
      let nextLast: string

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
          studentId: data.studentId,
          studentName: data.studentName,
          streakCount: nextCount,
          lastAnsweredDate: nextLast,
        },
        { merge: true }
      )

      return { streakCount: nextCount, lastAnsweredDate: nextLast }
    })

    return { id: docRef.id, streak: streakResult }
  }

  async delete(id: string): Promise<void> {
    await answersCollection.doc(id).delete()
  }

  async validateQuestionForAnswer(questionId: string): Promise<boolean> {
    const questionSnap = await questionsCollection.doc(questionId).get()
    const question = questionSnap.exists ? (questionSnap.data() as any) : null
    if (!question || question.deleted === true || question.status !== 'published') {
      return false
    }
    return true
  }
}

export class StreakService {
  async getForStudent(studentId: string, studentName: string): Promise<{
    streakCount: number
    lastAnsweredDate: string | null
  }> {
    const questionsSnap = await questionsCollection
      .where('status', '==', 'published')
      .get()

    const validQuestionIds = new Set<string>()
    for (const doc of questionsSnap.docs) {
      const q = doc.data() as any
      if (q?.deleted === true) continue
      validQuestionIds.add(doc.id)
    }

    const answersSnap = await answersCollection
      .where('studentId', '==', studentId)
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

    await streakCollection.doc(studentId).set(
      {
        studentId,
        studentName,
        streakCount,
        lastAnsweredDate,
      },
      { merge: true }
    )

    return { streakCount, lastAnsweredDate }
  }
}
