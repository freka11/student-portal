import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const { conversationId, teacherId, assignedBy } = await request.json()

    if (!conversationId) {
      return NextResponse.json({
        success: false,
        message: 'Conversation ID is required'
      }, { status: 400 })
    }

    console.log('🔥 Assigning conversation:', { conversationId, teacherId, assignedBy })

    // Get the conversation
    const conversationRef = adminFirestore.collection('conversations').doc(conversationId)
    const conversationDoc = await conversationRef.get()

    if (!conversationDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'Conversation not found'
      }, { status: 404 })
    }

    const conversationData = conversationDoc.data()
    if (!conversationData) {
      return NextResponse.json({
        success: false,
        message: 'Conversation data not found'
      }, { status: 404 })
    }

    let updateData: any = {
      updatedAt: FieldValue.serverTimestamp()
    }

    if (teacherId) {
      // Assign to teacher
      let teacherName: string | null = null
      let teacherPublicId: string | null = null

      try {
        const teacherDoc = await adminFirestore.collection('users').doc(teacherId).get()
        const teacherData = teacherDoc.exists ? teacherDoc.data() : null

        if (teacherData) {
          teacherName = teacherData.name || null
          teacherPublicId = teacherData.publicId || null
        }
      } catch {
        // If lookup fails, still allow assignment by ID
        teacherName = null
        teacherPublicId = null
      }
      
      updateData = {
        ...updateData,
        assignedTeacherId: teacherId,
        assignedTeacherPublicId: teacherPublicId,
        assignedTeacherName: teacherName,
        assignedBy: assignedBy,
        assignedAt: FieldValue.serverTimestamp(),
        status: 'assigned',
        authorizedUserIds: [conversationData.adminId, conversationData.studentId, teacherId]
      }
    } else {
      // Unassign
      updateData = {
        ...updateData,
        assignedTeacherId: null,
        assignedTeacherPublicId: null,
        assignedTeacherName: null,
        assignedBy: null,
        assignedAt: null,
        status: 'unassigned',
        authorizedUserIds: [conversationData.adminId, conversationData.studentId]
      }
    }

    await conversationRef.update(updateData)

    console.log('✅ Conversation assignment updated successfully')

    return NextResponse.json({
      success: true,
      message: teacherId ? 'Conversation assigned successfully' : 'Conversation unassigned successfully',
      assignment: {
        conversationId,
        assignedTeacherId: teacherId || null,
        assignedTeacherName: teacherId ? updateData.assignedTeacherName : null,
        status: updateData.status
      }
    })

  } catch (error) {
    console.error('❌ Error assigning conversation:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to assign conversation',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
