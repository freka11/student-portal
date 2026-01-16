'use client'

import { useEffect, useState } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, orderBy, onSnapshot, QuerySnapshot } from 'firebase/firestore'

// Initialize Firebase client for real-time listeners
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

interface Question {
  id: string
  text: string
  status: 'published' | 'draft'
  createdBy: {
    uid: string
    name: string
  }
  createdAt: any
  publishDate: string
}

interface Thought {
  id: string
  text: string
  status: 'published' | 'draft'
  createdBy: {
    uid: string
    name: string
  }
  createdAt: any
  publishDate: string
}

interface RealTimeContentListenerProps {
  onQuestionsUpdate?: (questions: Question[]) => void
  onThoughtsUpdate?: (thoughts: Thought[]) => void
  children?: (data: { questions: Question[], thoughts: Thought[] }) => React.ReactNode
}

export default function RealTimeContentListener({ 
  onQuestionsUpdate, 
  onThoughtsUpdate, 
  children 
}: RealTimeContentListenerProps) {
  const [realTimeQuestions, setRealTimeQuestions] = useState<Question[]>([])
  const [realTimeThoughts, setRealTimeThoughts] = useState<Thought[]>([])

  useEffect(() => {
    // Set up real-time listener for questions
    const questionsQuery = query(
      collection(db, 'questions'),
      where('status', '==', 'published'),
      orderBy('publishDate', 'desc')
    )

    const unsubscribeQuestions = onSnapshot(
      questionsQuery,
      (snapshot: QuerySnapshot) => {
        const questions = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        } as Question))
        
        setRealTimeQuestions(questions)
        onQuestionsUpdate?.(questions)
        
        console.log('🔄 Real-time questions updated:', questions.length, 'questions')
      },
      (error: any) => {
        console.error('❌ Real-time questions error:', error)
      }
    )

    // Listen for real-time thoughts updates
    const unsubscribeThoughts = onSnapshot(
      query(
        collection(db, 'thoughts'),
        where('status', '==', 'published'),
        orderBy('publishDate', 'desc')
      ),
      (snapshot: QuerySnapshot) => {
        const thoughts = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        } as Thought))
        
        setRealTimeThoughts(thoughts)
        onThoughtsUpdate?.(thoughts)
        
        console.log('🔄 Real-time thoughts updated:', thoughts.length, 'thoughts')
      },
      (error: any) => {
        console.error('❌ Real-time thoughts error:', error)
      }
    )

    // Cleanup listeners on unmount
    return () => {
      unsubscribeQuestions()
      unsubscribeThoughts()
    }
  }, [onQuestionsUpdate, onThoughtsUpdate])

  return (
    <>
      {/* Pass real-time data to children */}
      {children?.({
        questions: realTimeQuestions,
        thoughts: realTimeThoughts
      })}
    </>
  )
}
