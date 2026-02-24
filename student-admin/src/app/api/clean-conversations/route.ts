import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Starting cleanup of old conversations and messages...')

    // Get all conversations
    const conversationsSnapshot = await adminFirestore.collection('conversations').get()
    
    if (conversationsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No conversations found to clean',
        conversationsDeleted: 0,
        messagesDeleted: 0
      })
    }

    console.log(`📊 Found ${conversationsSnapshot.size} conversations to delete`)

    let conversationsDeleted = 0
    let messagesDeleted = 0
    const errors: string[] = []

    // Process conversations in batches
    const batchSize = 10
    const conversations = conversationsSnapshot.docs

    for (let i = 0; i < conversations.length; i += batchSize) {
      const batch = conversations.slice(i, i + batchSize)
      
      for (const conversationDoc of batch) {
        try {
          const conversationId = conversationDoc.id

          // First, delete all messages in this conversation's subcollection
          const messagesSnapshot = await adminFirestore
            .collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .get()

          if (!messagesSnapshot.empty) {
            // Delete messages in batches
            const messageBatch = adminFirestore.batch()
            messagesSnapshot.forEach(messageDoc => {
              messageBatch.delete(messageDoc.ref)
            })
            await messageBatch.commit()
            messagesDeleted += messagesSnapshot.size
            console.log(`🗑️  Deleted ${messagesSnapshot.size} messages from conversation ${conversationId}`)
          }

          // Delete the conversation document
          await adminFirestore.collection('conversations').doc(conversationId).delete()
          conversationsDeleted++
          console.log(`🗑️  Deleted conversation ${conversationId}`)

        } catch (error) {
          const errorMsg = `Failed to delete conversation ${conversationDoc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(`❌ ${errorMsg}`)
          errors.push(errorMsg)
        }
      }

      // Small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`🎉 Cleanup completed! Deleted ${conversationsDeleted} conversations and ${messagesDeleted} messages`)

    return NextResponse.json({
      success: true,
      message: 'Conversation cleanup completed successfully',
      stats: {
        conversationsFound: conversationsSnapshot.size,
        conversationsDeleted,
        messagesDeleted,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('❌ Error during conversation cleanup:', error)
    return NextResponse.json({
      success: false,
      message: 'Conversation cleanup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get current status of conversations
    const conversationsSnapshot = await adminFirestore.collection('conversations').get()
    let totalMessages = 0

    // Count messages for each conversation (limit to first 50 for performance)
    const sampleSize = Math.min(50, conversationsSnapshot.size)
    const sample = conversationsSnapshot.docs.slice(0, sampleSize)

    for (const conversationDoc of sample) {
      const messagesSnapshot = await adminFirestore
        .collection('conversations')
        .doc(conversationDoc.id)
        .collection('messages')
        .limit(100) // Limit message count for performance
        .get()
      
      totalMessages += messagesSnapshot.size
    }

    // Estimate total messages if we have a large number of conversations
    const estimatedTotalMessages = conversationsSnapshot.size > sampleSize 
      ? Math.round((totalMessages / sampleSize) * conversationsSnapshot.size)
      : totalMessages

    return NextResponse.json({
      success: true,
      message: 'Conversation status retrieved',
      stats: {
        totalConversations: conversationsSnapshot.size,
        estimatedTotalMessages,
        sampleSize,
        sampleMessages: totalMessages
      }
    })

  } catch (error) {
    console.error('❌ Error getting conversation status:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to get conversation status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
