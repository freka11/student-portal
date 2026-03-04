import admin from 'firebase-admin'
import { getFirestore, getFirebaseAdminApp } from '../../config/firebase'

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

  async listAll(): Promise<UserRecord[]> {
    const snap = await this.usersCol().get()
    return snap.docs.map((doc) => ({
      uid: doc.id,
      ...(doc.data() as any),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt || null,
    }))
  }

  async createTeacher(payload: { email: string; password?: string; name: string }) {
    const { email, password, name } = payload
    const auth = getFirebaseAdminApp().auth()
    const db = getFirestore()

    // 1. Create Auth User
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    })

    // 2. Get/Update Counter for Public ID
    const counterRef = db.collection('counters').doc('teacherCounter')
    const counterDoc = await counterRef.get()
    let counterValue = 1

    if (counterDoc.exists) {
      counterValue = (counterDoc.data()?.value || 0) + 1
      await counterRef.update({ value: counterValue })
    } else {
      await counterRef.set({ value: counterValue })
    }

    const publicId = `TCH-${counterValue.toString().padStart(4, '0')}`

    // 3. Create Firestore Doc
    const userDoc = {
      uid: userRecord.uid,
      email,
      name,
      role: 'teacher',
      publicId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      emailVerified: true,
      disabled: false,
    }

    await this.usersCol().doc(userRecord.uid).set(userDoc)

    return {
      uid: userRecord.uid,
      email,
      name,
      role: 'teacher',
      publicId,
    }
  }

  async promoteToSuperAdmin(uid: string) {
    const auth = getFirebaseAdminApp().auth()
    const db = getFirestore()

    await auth.setCustomUserClaims(uid, { role: 'super_admin' })
    await this.usersCol().doc(uid).update({
      role: 'super_admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return { success: true }
  }

  async setupUsers() {
    const TEST_USERS = [
      {
        username: 'student1',
        email: 'student1@student.com',
        password: 'student123',
        name: 'Student 1',
        role: 'student',
      },
      {
        username: 'student2',
        email: 'student2@student.com',
        password: 'student123',
        name: 'Student 2',
        role: 'student',
      },
      {
        username: 'teacher1',
        email: 'teacher1@admin.com',
        password: 'teacher123',
        name: 'Teacher 1',
        role: 'admin',
      },
      {
        username: 'teacher2',
        email: 'teacher2@admin.com',
        password: 'teacher123',
        name: 'Teacher 2',
        role: 'admin',
      },
    ]

    const results = []
    const auth = getFirebaseAdminApp().auth()

    for (const user of TEST_USERS) {
      try {
        // Check if user exists in Auth
        let userRecord
        try {
          userRecord = await auth.getUserByEmail(user.email)
        } catch (err: any) {
          if (err.code === 'auth/user-not-found') {
            userRecord = await auth.createUser({
              email: user.email,
              password: user.password,
              displayName: user.name,
            })
          } else {
            throw err
          }
        }

        // Check/Create in Firestore
        const doc = await this.usersCol().doc(userRecord.uid).get()
        if (!doc.exists) {
          await this.usersCol().doc(userRecord.uid).set({
            uid: userRecord.uid,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          })
        }

        results.push({ ...user, status: 'success', uid: userRecord.uid })
      } catch (err: any) {
        results.push({ ...user, status: 'error', error: err.message })
      }
    }

    return results
  }
}

