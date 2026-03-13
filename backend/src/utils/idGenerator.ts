// Public ID generation utility for sequential IDs
// Uses Firestore transactions to ensure no duplicate IDs

import { adminFirestore } from '../config/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

export type UserRole = 'student' | 'teacher' | 'super_admin' | 'admin'

interface CounterData {
    lastNumber: number
    prefix: string
    createdAt: FieldValue
    updatedAt: FieldValue
}

/**
 * Generate a sequential public ID for a given role
 */
export async function generatePublicId(role: UserRole): Promise<string> {
    const counterId = getCounterId(role)
    const counterRef = adminFirestore.collection('counters').doc(counterId)

    try {
        const result = await adminFirestore.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef)

            if (!counterDoc.exists) {
                throw new Error(`Counter ${counterId} does not exist. Please run setup-counters first.`)
            }

            const counterData = counterDoc.data() as CounterData
            const nextNumber = counterData.lastNumber + 1
            const publicId = `${counterData.prefix}-${nextNumber.toString().padStart(4, '0')}`

            transaction.update(counterRef, {
                lastNumber: nextNumber,
                updatedAt: FieldValue.serverTimestamp()
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

function getCounterId(role: UserRole): string {
    switch (role) {
        case 'student': return 'studentCounter'
        case 'teacher': return 'teacherCounter'
        case 'super_admin': return 'superAdminCounter'
        case 'admin': return 'adminCounter'
        default: throw new Error(`Unknown role: ${role}`)
    }
}

export function getRolePrefix(role: UserRole): string {
    switch (role) {
        case 'student': return 'STU'
        case 'teacher': return 'TCH'
        case 'super_admin': return 'SUP'
        case 'admin': return 'ADM'
        default: throw new Error(`Unknown role: ${role}`)
    }
}

export async function initializeCounters(): Promise<void> {
    const counters = [
        { id: 'studentCounter', lastNumber: 0, prefix: 'STU' },
        { id: 'adminCounter', lastNumber: 0, prefix: 'ADM' },
        { id: 'teacherCounter', lastNumber: 0, prefix: 'TCH' },
        { id: 'superAdminCounter', lastNumber: 0, prefix: 'SUP' }
    ]

    const batch = adminFirestore.batch()

    for (const counter of counters) {
        const counterRef = adminFirestore.collection('counters').doc(counter.id)
        batch.set(counterRef, {
            lastNumber: counter.lastNumber,
            prefix: counter.prefix,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true })
    }

    await batch.commit()
    console.log('✅ Counters initialized successfully')
}

export async function getCounterValues(): Promise<Record<string, { lastNumber: number; prefix: string }>> {
    const countersSnapshot = await adminFirestore.collection('counters').get()
    const counters: Record<string, { lastNumber: number; prefix: string }> = {}

    countersSnapshot.forEach(doc => {
        const data = doc.data()
        counters[doc.id] = {
            lastNumber: data.lastNumber,
            prefix: data.prefix
        }
    })

    return counters
}

export function parsePublicId(publicId: string): { role: UserRole; number: number } | null {
    const match = publicId.match(/^([A-Z]+)-(\d+)$/)
    if (!match) return null

    const prefix = match[1]
    const number = parseInt(match[2], 10)

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
