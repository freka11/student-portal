// Public ID generation utility for sequential IDs
// Uses Firestore transactions to ensure no duplicate IDs

import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase-client'

export type UserRole = 'student' | 'teacher' | 'super_admin' | 'admin'

interface CounterData {
  lastNumber: number
  prefix: string
  createdAt: unknown
  updatedAt: unknown
}

/**
 * Generate a sequential public ID for a given role
 * @param role - The user role ('student' | 'teacher' | 'super_admin' | 'admin')
 * @returns Promise<string> - The generated public ID (e.g., 'STU-0001')
 */
export async function generatePublicId(role: UserRole): Promise<string> {
  const counterId = getCounterId(role)
  const counterRef = doc(db, 'counters', counterId)

  try {
    const result = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef)
      
      if (!counterDoc.exists) {
        throw new Error(`Counter ${counterId} does not exist. Please run setup-counters first.`)
      }

      const counterData = counterDoc.data() as CounterData
      const nextNumber = counterData.lastNumber + 1
      const publicId = `${counterData.prefix}-${nextNumber.toString().padStart(4, '0')}`

      // Update the counter
      transaction.update(counterRef, {
        lastNumber: nextNumber,
        updatedAt: serverTimestamp(),
      })

      return publicId
    })

    console.log(`✅ Generated ${role} public ID: ${result}`)
    return result

  } catch (error) {
    console.error(`❌ Error generating public ID for ${role}:`, error)
    throw new Error(`Failed to generate public ID for ${role}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get the counter document ID for a given role
 * @param role - The user role
 * @returns The counter document ID
 */
function getCounterId(role: UserRole): string {
  switch (role) {
    case 'student':
      return 'studentCounter'
    case 'teacher':
      return 'teacherCounter'
    case 'super_admin':
      return 'superAdminCounter'
    case 'admin':
      return 'adminCounter'
    default:
      throw new Error(`Unknown role: ${role}`)
  }
}

/**
 * Get the prefix for a given role
 * @param role - The user role
 * @returns The prefix string
 */
export function getRolePrefix(role: UserRole): string {
  switch (role) {
    case 'student':
      return 'STU'
    case 'teacher':
      return 'TCH'
    case 'super_admin':
      return 'SUP'
    case 'admin':
      return 'ADM'
    default:
      throw new Error(`Unknown role: ${role}`)
  }
}

/**
 * Initialize all counters if they don't exist
 * This should be called once during setup
 */
export async function initializeCounters(): Promise<void> {
  const counters = [
    { id: 'studentCounter', lastNumber: 0, prefix: 'STU' },
    { id: 'adminCounter', lastNumber: 0, prefix: 'ADM' },
    { id: 'teacherCounter', lastNumber: 0, prefix: 'TCH' },
    { id: 'superAdminCounter', lastNumber: 0, prefix: 'SUP' }
  ]

  await runTransaction(db, async (transaction) => {
    for (const counter of counters) {
      const counterRef = doc(db, 'counters', counter.id)
      const snap = await transaction.get(counterRef)

      if (!snap.exists()) {
        transaction.set(counterRef, {
          lastNumber: counter.lastNumber,
          prefix: counter.prefix,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }
    }
  })

  console.log('✅ Counters initialized successfully')
}

/**
 * Get current counter values for all roles
 * @returns Promise<object> - Current counter values
 */
export async function getCounterValues(): Promise<Record<string, { lastNumber: number; prefix: string }>> {
  const ids = ['studentCounter', 'adminCounter', 'teacherCounter', 'superAdminCounter']

  const result: Record<string, { lastNumber: number; prefix: string }> = {}
  await Promise.all(
    ids.map(async (id) => {
      const snap = await runTransaction(db, async (transaction) => transaction.get(doc(db, 'counters', id)))
      if (!snap.exists()) return
      const data = snap.data() as any
      result[id] = { lastNumber: data.lastNumber, prefix: data.prefix }
    })
  )

  return result
}

/**
 * Parse a public ID to extract role and number
 * @param publicId - The public ID to parse (e.g., 'STU-0001')
 * @returns Object with role and number, or null if invalid
 */
export function parsePublicId(publicId: string): { role: UserRole; number: number } | null {
  const match = publicId.match(/^([A-Z]+)-(\d+)$/)
  if (!match) return null

  const prefix = match[1]
  const number = parseInt(match[2], 10)

  // Map prefix back to role
  const prefixToRole: Record<string, UserRole> = {
    'STU': 'student',
    'TCH': 'teacher',
    'SUP': 'super_admin',
    'ADM': 'admin'
  }

  const role = prefixToRole[prefix]
  if (!role) return null

  return { role, number }
}
