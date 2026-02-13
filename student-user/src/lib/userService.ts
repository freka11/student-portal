// User service for fetching users by role
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebase-client'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'student'
  avatar?: string
}

// Get all users with a specific role
export const getUsersByRole = async (role: 'admin' | 'student'): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('role', '==', role))
    
    const snapshot = await getDocs(q)
    const users: User[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      users.push({
        id: doc.id,
        name: data.name || 'Unknown',
        email: data.email || '',
        role: data.role,
        avatar: data.avatar,
      })
    })

    return users
  } catch (error) {
    console.error('Error fetching users by role:', error)
    throw error
  }
}

// Get a single user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('__name__', '==', userId))
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    const data = doc.data()
    
    return {
      id: doc.id,
      name: data.name || 'Unknown',
      email: data.email || '',
      role: data.role,
      avatar: data.avatar,
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    throw error
  }
}
