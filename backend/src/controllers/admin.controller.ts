import { Request, Response } from 'express'
import { adminAuth, adminFirestore } from '../config/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'
import { generatePublicId } from '../utils/idGenerator'

// ─── Test users list (shared) ──────────────────────────────────────
const TEST_USERS = [
    { username: 'student1', email: 'student1@student.com', password: 'student123', name: 'Student 1', role: 'student' },
    { username: 'student2', email: 'student2@student.com', password: 'student123', name: 'Student 2', role: 'student' },
    { username: 'teacher1', email: 'teacher1@admin.com', password: 'teacher123', name: 'Teacher 1', role: 'admin' },
    { username: 'teacher2', email: 'teacher2@admin.com', password: 'teacher123', name: 'Teacher 2', role: 'admin' },
]

// ─── GET /api/admin/users ──────────────────────────────────────────
export async function listUsers(_req: Request, res: Response) {
    try {
        const usersSnapshot = await adminFirestore.collection('users').get()
        const users: any[] = []

        usersSnapshot.forEach(doc => {
            const data = doc.data()
            users.push({
                uid: doc.id,
                email: data.email,
                name: data.name,
                role: data.role,
                publicId: data.publicId || null,
                createdAt: data.createdAt?.toDate?.() || data.createdAt || null,
            })
        })

        res.json({ success: true, message: 'Users retrieved successfully', users })
    } catch (error) {
        console.error('❌ Error listing users:', error)
        res.status(500).json({ success: false, message: 'Failed to retrieve users', error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

// ─── POST /api/admin/create-teacher ────────────────────────────────
export async function createTeacher(req: Request, res: Response) {
    try {
        const { email, password, name } = req.body

        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required' })
            return
        }

        const userRecord = await adminAuth.createUser({ email, password, displayName: name || 'Teacher' })

        const counterDoc = await adminFirestore.collection('counters').doc('teacherCounter').get()
        let counterValue = 1
        if (counterDoc.exists) {
            const counterData = counterDoc.data()
            if (counterData && typeof counterData.value === 'number') counterValue = counterData.value + 1
            await adminFirestore.collection('counters').doc('teacherCounter').update({ value: counterValue })
        } else {
            await adminFirestore.collection('counters').doc('teacherCounter').set({ value: counterValue })
        }

        const publicId = `TCH-${counterValue.toString().padStart(4, '0')}`

        await adminFirestore.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid, email, name: name || 'Teacher', role: 'teacher', publicId,
            createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
            emailVerified: true, disabled: false,
        })

        res.json({ success: true, message: 'Teacher created successfully', user: { uid: userRecord.uid, email, name: name || 'Teacher', role: 'teacher', publicId } })
    } catch (error) {
        console.error('❌ Error creating teacher:', error)
        res.status(500).json({ success: false, message: 'Failed to create teacher', error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

// ─── POST /api/admin/create-superadmin ─────────────────────────────
export async function createSuperadmin(req: Request, res: Response) {
    try {
        const { email, uid } = req.body

        if (!email && !uid) {
            res.status(400).json({ success: false, message: 'Either email or uid must be provided' })
            return
        }

        let userQuery: FirebaseFirestore.DocumentReference
        if (uid) {
            userQuery = adminFirestore.collection('users').doc(uid)
        } else {
            const usersSnapshot = await adminFirestore.collection('users').where('email', '==', email).get()
            if (usersSnapshot.empty) {
                res.status(404).json({ success: false, message: 'User not found with provided email' })
                return
            }
            userQuery = usersSnapshot.docs[0].ref
        }

        const userDoc = await userQuery.get()
        if (!userDoc.exists) {
            res.status(404).json({ success: false, message: 'User not found' })
            return
        }

        const userData = userDoc.data()!
        const updatedData: any = { ...userData, role: 'super_admin', updatedAt: FieldValue.serverTimestamp() }

        if (!userData.publicId) {
            updatedData.publicId = await generatePublicId('super_admin')
        }

        await userQuery.update(updatedData)

        res.json({ success: true, message: 'Super admin created successfully', user: { uid: userDoc.id, email: userData.email, name: userData.name, role: 'super_admin', publicId: updatedData.publicId } })
    } catch (error) {
        console.error('❌ Error creating super admin:', error)
        res.status(500).json({ success: false, message: 'Failed to create super admin', error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

// ─── GET /api/admin/superadmins ────────────────────────────────────
export async function getSuperadmins(_req: Request, res: Response) {
    try {
        const snapshot = await adminFirestore.collection('users').where('role', '==', 'super_admin').get()
        const superAdmins: any[] = []
        snapshot.forEach(doc => {
            const data = doc.data()
            superAdmins.push({ uid: doc.id, email: data.email, name: data.name, publicId: data.publicId, role: data.role })
        })
        res.json({ success: true, message: 'Super admins retrieved', superAdmins })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve super admins', error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

// ─── POST /api/admin/create-direct-superadmin ──────────────────────
export async function createDirectSuperadmin(req: Request, res: Response) {
    try {
        const { email, password, name } = req.body
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required' })
            return
        }

        const userRecord = await adminAuth.createUser({ email, password, displayName: name || 'Super Admin' })

        const counterDoc = await adminFirestore.collection('counters').doc('superAdminCounter').get()
        let counterValue = 1
        if (counterDoc.exists) {
            const counterData = counterDoc.data()
            if (counterData && typeof counterData.value === 'number') counterValue = counterData.value + 1
            await adminFirestore.collection('counters').doc('superAdminCounter').update({ value: counterValue })
        } else {
            await adminFirestore.collection('counters').doc('superAdminCounter').set({ value: counterValue })
        }

        const publicId = `SUP-${counterValue.toString().padStart(4, '0')}`

        await adminFirestore.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid, email, name: name || 'Super Admin', role: 'super_admin', publicId,
            createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
            emailVerified: true, disabled: false,
        })

        res.json({ success: true, message: 'Super admin created successfully', user: { uid: userRecord.uid, email, name: name || 'Super Admin', role: 'super_admin', publicId } })
    } catch (error) {
        console.error('❌ Error creating super admin:', error)
        res.status(500).json({ success: false, message: 'Failed to create super admin', error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

// ─── POST /api/admin/promote-to-superadmin ─────────────────────────
export async function promoteToSuperadmin(req: Request, res: Response) {
    try {
        const { email } = req.body
        if (!email) { res.status(400).json({ success: false, message: 'Email is required' }); return }

        const usersSnapshot = await adminFirestore.collection('users').where('email', '==', email).get()
        if (usersSnapshot.empty) { res.status(404).json({ success: false, message: 'User not found' }); return }

        const userDoc = usersSnapshot.docs[0]
        const userData = userDoc.data()

        await userDoc.ref.update({ role: 'super_admin', updatedAt: FieldValue.serverTimestamp() })

        res.json({ success: true, message: 'User promoted to super admin successfully', user: { uid: userDoc.id, email: userData.email, name: userData.name, role: 'super_admin' } })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to promote', error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

// ─── POST /api/admin/transition-roles ──────────────────────────────
export async function transitionRoles(req: Request, res: Response) {
    try {
        const { transitions } = req.body
        if (!transitions || !Array.isArray(transitions)) {
            res.status(400).json({ success: false, message: 'Transitions array is required' })
            return
        }

        const batch = adminFirestore.batch()
        let processedCount = 0

        for (const transition of transitions) {
            const { email, newRole, publicId } = transition
            if (!email || !newRole) continue

            const usersSnapshot = await adminFirestore.collection('users').where('email', '==', email).get()
            if (usersSnapshot.empty) continue

            const userDoc = usersSnapshot.docs[0]
            const updateData: any = { role: newRole, updatedAt: FieldValue.serverTimestamp() }
            if (publicId) updateData.publicId = publicId

            batch.update(userDoc.ref, updateData)
            processedCount++
        }

        await batch.commit()
        res.json({ success: true, message: `Successfully transitioned ${processedCount} users`, processedCount })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to transition roles', error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

// ─── GET /api/admin/role-distribution ──────────────────────────────
export async function getRoleDistribution(_req: Request, res: Response) {
    try {
        const usersSnapshot = await adminFirestore.collection('users').get()
        const roleDistribution: any = { student: 0, admin: 0, teacher: 0, super_admin: 0, total: 0 }
        const usersWithoutPublicId: any[] = []

        usersSnapshot.forEach(doc => {
            const data = doc.data()
            const role = data.role || 'student'
            if (roleDistribution.hasOwnProperty(role)) roleDistribution[role]++
            roleDistribution.total++
            if (!data.publicId) {
                usersWithoutPublicId.push({ uid: doc.id, email: data.email, name: data.name, currentRole: role })
            }
        })

        res.json({
            success: true, roleDistribution, usersWithoutPublicId,
            suggestedTransitions: [
                { email: 'admin@admin.com', newRole: 'super_admin', publicId: 'SUP-0001' },
                { email: 'teacher1@admin.com', newRole: 'teacher', publicId: 'TCH-0001' },
                { email: 'teacher2@admin.com', newRole: 'teacher', publicId: 'TCH-0002' },
            ],
        })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get role distribution', error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

// ─── POST /api/admin/assign-conversation ───────────────────────────
export async function assignConversation(req: Request, res: Response) {
    try {
        const { conversationId, teacherId, assignedBy } = req.body
        if (!conversationId) { res.status(400).json({ success: false, message: 'Conversation ID is required' }); return }

        const conversationRef = adminFirestore.collection('conversations').doc(conversationId)
        const conversationDoc = await conversationRef.get()
        if (!conversationDoc.exists) { res.status(404).json({ success: false, message: 'Conversation not found' }); return }

        const conversationData = conversationDoc.data()!
        let updateData: any = { updatedAt: FieldValue.serverTimestamp() }

        if (teacherId) {
            let teacherName: string | null = null
            let teacherPublicId: string | null = null
            try {
                const teacherDoc = await adminFirestore.collection('users').doc(teacherId).get()
                const teacherData = teacherDoc.exists ? teacherDoc.data() : null
                if (teacherData) { teacherName = teacherData.name || null; teacherPublicId = teacherData.publicId || null }
            } catch { /* ignore */ }

            updateData = {
                ...updateData, assignedTeacherId: teacherId, assignedTeacherPublicId: teacherPublicId,
                assignedTeacherName: teacherName, assignedBy, assignedAt: FieldValue.serverTimestamp(),
                status: 'assigned', authorizedUserIds: [conversationData.adminId, conversationData.studentId, teacherId],
            }
        } else {
            updateData = {
                ...updateData, assignedTeacherId: null, assignedTeacherPublicId: null,
                assignedTeacherName: null, assignedBy: null, assignedAt: null,
                status: 'unassigned', authorizedUserIds: [conversationData.adminId, conversationData.studentId],
            }
        }

        await conversationRef.update(updateData)

        res.json({
            success: true,
            message: teacherId ? 'Conversation assigned successfully' : 'Conversation unassigned successfully',
            assignment: { conversationId, assignedTeacherId: teacherId || null, assignedTeacherName: teacherId ? updateData.assignedTeacherName : null, status: updateData.status },
        })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to assign conversation', error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

// ─── POST /api/admin/backfill-public-ids ───────────────────────────
export async function backfillPublicIds(_req: Request, res: Response) {
    try {
        const usersSnapshot = await adminFirestore.collection('users').get()
        if (usersSnapshot.empty) { res.json({ success: true, message: 'No users found', usersUpdated: 0 }); return }

        let usersUpdated = 0
        const errors: string[] = []
        const batchSize = 10
        const users = usersSnapshot.docs

        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize)
            for (const userDoc of batch) {
                try {
                    const userData = userDoc.data()
                    if (userData.publicId) continue
                    const role = userData.role || 'student'
                    const publicId = await generatePublicId(role as any)
                    await adminFirestore.collection('users').doc(userDoc.id).update({ publicId, updatedAt: FieldValue.serverTimestamp() })
                    usersUpdated++
                } catch (error) {
                    errors.push(`Failed to update user ${userDoc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        res.json({ success: true, message: 'Backfill completed', stats: { totalUsers: usersSnapshot.size, usersUpdated, usersSkipped: usersSnapshot.size - usersUpdated, errors: errors.length }, errors: errors.length > 0 ? errors : undefined })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Backfill failed', error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

// ─── GET /api/admin/public-id-status ───────────────────────────────
export async function getPublicIdStatus(_req: Request, res: Response) {
    try {
        const usersSnapshot = await adminFirestore.collection('users').get()
        let withPublicId = 0, withoutPublicId = 0
        const usersByRole: Record<string, number> = {}

        usersSnapshot.forEach(doc => {
            const userData = doc.data()
            const role = userData.role || 'unknown'
            usersByRole[role] = (usersByRole[role] || 0) + 1
            if (userData.publicId) withPublicId++
            else withoutPublicId++
        })

        res.json({ success: true, stats: { totalUsers: usersSnapshot.size, withPublicId, withoutPublicId, usersByRole } })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get status', error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

// ─── POST /api/admin/clean-conversations ───────────────────────────
export async function cleanConversations(_req: Request, res: Response) {
    try {
        const conversationsSnapshot = await adminFirestore.collection('conversations').get()
        if (conversationsSnapshot.empty) { res.json({ success: true, message: 'No conversations to clean', conversationsDeleted: 0, messagesDeleted: 0 }); return }

        let conversationsDeleted = 0, messagesDeleted = 0
        const errors: string[] = []
        const conversations = conversationsSnapshot.docs

        for (let i = 0; i < conversations.length; i += 10) {
            const batch = conversations.slice(i, i + 10)
            for (const conversationDoc of batch) {
                try {
                    const messagesSnapshot = await adminFirestore.collection('conversations').doc(conversationDoc.id).collection('messages').get()
                    if (!messagesSnapshot.empty) {
                        const messageBatch = adminFirestore.batch()
                        messagesSnapshot.forEach(msgDoc => messageBatch.delete(msgDoc.ref))
                        await messageBatch.commit()
                        messagesDeleted += messagesSnapshot.size
                    }
                    await adminFirestore.collection('conversations').doc(conversationDoc.id).delete()
                    conversationsDeleted++
                } catch (error) {
                    errors.push(`Failed to delete conversation ${conversationDoc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        res.json({ success: true, message: 'Cleanup completed', stats: { conversationsFound: conversationsSnapshot.size, conversationsDeleted, messagesDeleted, errors: errors.length }, errors: errors.length > 0 ? errors : undefined })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Cleanup failed', error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

// ─── GET /api/admin/conversation-status ────────────────────────────
export async function getConversationStatus(_req: Request, res: Response) {
    try {
        const conversationsSnapshot = await adminFirestore.collection('conversations').get()
        let totalMessages = 0
        const sampleSize = Math.min(50, conversationsSnapshot.size)
        const sample = conversationsSnapshot.docs.slice(0, sampleSize)

        for (const doc of sample) {
            const messagesSnapshot = await adminFirestore.collection('conversations').doc(doc.id).collection('messages').limit(100).get()
            totalMessages += messagesSnapshot.size
        }

        const estimatedTotalMessages = conversationsSnapshot.size > sampleSize
            ? Math.round((totalMessages / sampleSize) * conversationsSnapshot.size)
            : totalMessages

        res.json({ success: true, stats: { totalConversations: conversationsSnapshot.size, estimatedTotalMessages, sampleSize, sampleMessages: totalMessages } })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get conversation status', error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

// ─── POST /api/admin/setup-counters ────────────────────────────────
export async function setupCounters(_req: Request, res: Response) {
    try {
        const counters = [
            { id: 'studentCounter', lastNumber: 0, prefix: 'STU' },
            { id: 'adminCounter', lastNumber: 0, prefix: 'ADM' },
            { id: 'teacherCounter', lastNumber: 0, prefix: 'TCH' },
            { id: 'superAdminCounter', lastNumber: 0, prefix: 'SUP' },
        ]

        const batch = adminFirestore.batch()
        for (const counter of counters) {
            const ref = adminFirestore.collection('counters').doc(counter.id)
            batch.set(ref, { lastNumber: counter.lastNumber, prefix: counter.prefix, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
        }
        await batch.commit()

        res.json({ success: true, message: 'Counters initialized', counters: counters.map(c => `${c.id} (${c.prefix}-0001, ...)`) })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to setup counters', error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

// ─── GET /api/admin/counters ───────────────────────────────────────
export async function getCounters(_req: Request, res: Response) {
    try {
        const snapshot = await adminFirestore.collection('counters').get()
        const counters: any[] = []
        snapshot.forEach(doc => counters.push({ id: doc.id, ...doc.data() }))
        res.json({ success: true, counters })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve counters', error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

// ─── POST /api/admin/setup-users ───────────────────────────────────
export async function setupUsers(_req: Request, res: Response) {
    res.json({
        success: true,
        message: 'Firebase Admin SDK setup guide',
        setupRequired: true,
        instructions: {
            step1: 'Go to Firebase Console: https://console.firebase.google.com',
            step2: 'Select your project: student-portal-fab55',
            step3: 'Go to Authentication → Users',
            step4: 'Click "Add user" and create users with these credentials:',
        },
        users: TEST_USERS,
    })
}

// ─── GET /api/admin/setup-info ─────────────────────────────────────
export async function getSetupInfo(_req: Request, res: Response) {
    res.json({
        message: 'Firebase Admin SDK setup required',
        setupRequired: true,
        instructions: 'POST /api/admin/setup-users for detailed instructions',
        users: TEST_USERS,
    })
}

// ─── POST /api/admin/setup-collections ─────────────────────────────
export async function setupCollections(_req: Request, res: Response) {
    try {
        await adminFirestore.collection('questions').doc('sample-question').set({
            text: 'What is your favorite programming language and why?',
            status: 'published', targetAudience: 'students',
            createdBy: { uid: 'admin-uid-sample', name: 'Admin User' },
            createdAt: new Date(), publishDate: '2024-01-16',
        })

        await adminFirestore.collection('thoughts').doc('sample-thought').set({
            text: 'Today is a great day to learn something new and expand your knowledge!',
            status: 'published', targetAudience: 'students',
            createdBy: { uid: 'admin-uid-sample', name: 'Admin User' },
            createdAt: new Date(), publishDate: '2024-01-16',
        })

        res.json({ success: true, message: 'Collections created successfully', collections: ['questions', 'thoughts'] })
    } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

// ─── GET /api/admin/test-users ─────────────────────────────────────
export async function getTestUsers(_req: Request, res: Response) {
    res.json({
        message: 'Test Users Creation Guide',
        instructions: { step1: 'Go to Firebase Console', step2: 'Select project: student-portal-fab55', step3: 'Go to Authentication → Users', step4: 'Click "Add user" for each:', users: TEST_USERS },
    })
}
