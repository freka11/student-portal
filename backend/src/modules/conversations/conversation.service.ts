import admin from 'firebase-admin'
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

  async assignTeacher(payload: { conversationId: string; teacherId: string; assignedBy: string }) {
    const { conversationId, teacherId, assignedBy } = payload
    const db = getFirestore()

    const conversationRef = this.col().doc(conversationId)
    const conversationSnap = await conversationRef.get()

    if (!conversationSnap.exists) {
      throw new Error('Conversation not found')
    }

    const conversationData = conversationSnap.data()!

    // Lookup teacher details
    const teacherSnap = await db.collection('users').doc(teacherId).get()
    const teacherData = teacherSnap.exists ? teacherSnap.data() : null

    const updateData: any = {
      assignedTeacherId: teacherId,
      assignedTeacherPublicId: teacherData?.publicId || null,
      assignedTeacherName: teacherData?.name || null,
      assignedBy,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'assigned',
      authorizedUserIds: [
        conversationData.adminId,
        conversationData.studentId,
        teacherId,
      ].filter(Boolean),
    }

    await conversationRef.update(updateData)
    return { success: true, teacherName: updateData.assignedTeacherName }
  }

  async unassignTeacher(conversationId: string) {
    const conversationRef = this.col().doc(conversationId)
    const conversationSnap = await conversationRef.get()

    if (!conversationSnap.exists) {
      throw new Error('Conversation not found')
    }

    const conversationData = conversationSnap.data()!

    const updateData: any = {
      assignedTeacherId: null,
      assignedTeacherPublicId: null,
      assignedTeacherName: null,
      assignedBy: null,
      assignedAt: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'unassigned',
      authorizedUserIds: [
        conversationData.adminId,
        conversationData.studentId,
      ].filter(Boolean),
    }

    await conversationRef.update(updateData)
    return { success: true }
  }
}

