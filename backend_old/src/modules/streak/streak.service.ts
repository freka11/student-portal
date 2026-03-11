import { getFirestore } from '../../config/firebase'

export class StreakService {
  private col() {
    return getFirestore().collection('streaks')
  }

  async getForUser(uid: string) {
    const snap = await this.col().doc(uid).get()
    if (!snap.exists) return null
    return { id: snap.id, ...(snap.data() as any) }
  }
}

