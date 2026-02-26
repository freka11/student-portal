import { getFirestore } from '../../config/firebase'

export class CounterService {
  private col() {
    return getFirestore().collection('counters')
  }

  async getCounter(name: string) {
    const snap = await this.col().doc(name).get()
    if (!snap.exists) return null
    return { id: snap.id, ...(snap.data() as any) }
  }
}

