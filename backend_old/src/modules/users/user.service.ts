import { getFirestore } from '../../config/firebase'

export type UserRecord = {
  id: string
  email?: string
  name?: string
  role?: string
  [key: string]: unknown
}

export class UserService {
  private usersCol() {
    return getFirestore().collection('users')
  }

  async getByUid(uid: string): Promise<UserRecord | null> {
    const snap = await this.usersCol().doc(uid).get()
    if (!snap.exists) return null
    return { id: snap.id, ...(snap.data() as any) }
  }

  async getByEmail(email: string): Promise<UserRecord | null> {
    const qs = await this.usersCol().where('email', '==', email).limit(1).get()
    if (qs.empty) return null
    const doc = qs.docs[0]
    return { id: doc.id, ...(doc.data() as any) }
  }
}

