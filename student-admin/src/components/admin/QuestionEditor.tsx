'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { Textarea } from '@/components/admin/Textarea'
import { HelpCircle, Save, Eye, Plus, Trash2 } from 'lucide-react'

interface Question {
  id: string
  question: string
  date: string
  adminName: string
  adminId: string
  status: 'published' | 'draft'
}

interface QuestionHistoryItem {
  id: string
  date: string
  questions: Question[]
  adminName: string
  adminId: string
}

interface QuestionEditorProps {
  onQuestionSaved: (questions: Question[]) => void
}

export default function QuestionEditor({ onQuestionSaved }: QuestionEditorProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [existingQuestions, setExistingQuestions] = useState<Question[]>([])

  // Load existing questions from API
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch('/api/questions')
        if (response.ok) {
          const data = await response.json()
          // API returns array of questions with 'text' field, map to 'question' field
          const mappedQuestions = data.map((q: any) => ({
            ...q,
            question: q.text // Map text field to question field
          }))
          setExistingQuestions(mappedQuestions)
          setQuestions(mappedQuestions)
        }
      } catch (error) {
        console.error('Failed to load questions:', error)
        // Fallback to localStorage
        const savedQuestions = localStorage.getItem('dailyQuestions')
        if (savedQuestions) {
          const parsed = JSON.parse(savedQuestions)
          setExistingQuestions(parsed)
          setQuestions(parsed)
        }
      }
    }

    loadQuestions()
  }, [])

  const createNewQuestionItem = (questions: Question[]): QuestionHistoryItem => {
    const today = new Date()
    return {
      id: Date.now().toString(),
      date: today.toISOString().split('T')[0], // YYYY-MM-DD format
      questions,
      adminName: 'Current Admin',
      adminId: 'admin01'
    }
  }

  const addQuestion = () => {
    const today = new Date()
    const newQuestion: Question = {
      id: `temp-${Date.now().toString()}`, // Use temporary ID for new questions
      question: '',
      date: today.toISOString().split('T')[0],
      adminName: 'Current Admin',
      adminId: 'admin01',
      status: 'published' // Default to published since draft option is removed
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const updateQuestion = (id: string, field: keyof Question, value: string) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ))
  }

  const handleUpdate = async () => {
    const validQuestions = questions.filter(q => q.question.trim())
    
    if (validQuestions.length === 0) return

    setIsSaving(true)
    
    try {
      // Save each question individually to the API
      const savePromises = validQuestions.map(async (question) => {
        // Check if question exists (has an ID that's not a temporary one)
        const isExistingQuestion = existingQuestions.some(eq => eq.id === question.id && !question.id.startsWith('temp-'))
        
        let requestData: any = {
          question: question.question,
          status: 'published' // Always set to published since draft option is removed
        }
        
        console.log('Saving question data:', requestData)
        
        const url = `/api/questions`
        const method = isExistingQuestion ? 'PUT' : 'POST'
        
        if (isExistingQuestion) {
          // For existing questions, include the ID in the request body for PUT
          requestData.id = question.id
        }
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('API response error:', errorText)
          throw new Error(`API error: ${response.status} - ${errorText}`)
        }
        
        return response
      })
      
      const responses = await Promise.all(savePromises)
      
      // Check if all saves were successful
      if (responses.every(response => response.ok)) {
        // Also save to localStorage for current session
        localStorage.setItem('dailyQuestions', JSON.stringify(validQuestions))
        setExistingQuestions(validQuestions)
        
        // Create question item for event/callback
        const newQuestionItem = createNewQuestionItem(validQuestions)
        
        // Emit event for other components
        window.dispatchEvent(new CustomEvent('newQuestion', { detail: newQuestionItem }))
        
        onQuestionSaved(validQuestions)
      } else {
        throw new Error('Failed to update to server')
      }
    } catch (error) {
      console.error('Failed to update questions:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Manage Questions
        </CardTitle>
        <CardDescription>
          Add discussion question for today
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No question added yet</p>
            <Button 
              onClick={addQuestion}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add First Question
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Question {index + 1}
                    </h4>
                    <Button
                      onClick={() => removeQuestion(q.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Question Content
                      </label>
                      <Textarea
                        placeholder="Enter your question here..."
                        value={q.question}
                        onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                        className="min-h-20"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add Question Button */}
            <Button 
              onClick={addQuestion}
              variant="outline"
              className="flex items-center gap-2 w-full"
            >
              <Plus className="h-4 w-4" />
              Add Another Question
            </Button>
          </>
        )}
        
        {questions.length > 0 && (
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={handleUpdate} 
              disabled={isSaving || questions.filter(q => q.question.trim()).length === 0}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Questions'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
          </div>
        )}

        {/* Preview Section */}
        {showPreview && questions.filter(q => q.question.trim()).length > 0 && (
          <div className="mt-4 ">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
            <div className="space-y-3">
              {questions.filter(q => q.question.trim()).map((q, index) => (
                <div key={q.id} className="bg-linear-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Question {index + 1}</span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      q.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {q.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-3">  
                    {q.question}
                  </p>
                  <div className=" p-3 rounded border border-purple-100">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Your Answer:</label>
                    <textarea
                      className="w-full p-2 text-sm  border-none outline-none resize-none"
                      rows={3}
                      placeholder="Type your answer here..."  
                   
                    />
                  </div>
                  <div className="mt-2 pt-2 border-t border-purple-200">
                    <p className="text-xs text-purple-600">{today}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
