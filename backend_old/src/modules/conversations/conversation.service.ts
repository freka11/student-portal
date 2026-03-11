import { getFirestore } from '../../config/firebase'

export class ConversationService {
  private col() {
    return getFirestore().collection('conversations')
  }

  async getById(conversationId: string) {
    const snap = await this.col().doc(conversationId).get()
    if (!snap.exists) return null
    return { id: snap.id, ...(snap.data() as any) }
  }
}

