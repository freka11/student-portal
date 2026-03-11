import { getFirestore } from '../../config/firebase'

export class AnswerService {
  private col() {
    return getFirestore().collection('answers')
  }

  async listByQuestionId(questionId: string) {
    const snap = await this.col().where('questionId', '==', questionId).get()
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
  }

  async create(input: { questionId: string; text: string; createdBy?: any }) {
    const docRef = await this.col().add({
      questionId: input.questionId,
      text: input.text,
      createdBy: input.createdBy ?? null,
      createdAt: new Date().toISOString(),
    })
    return docRef.id
  }
}

