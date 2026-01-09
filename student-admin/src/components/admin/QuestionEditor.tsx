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

  // Load existing questions (could be from localStorage or API)
  useEffect(() => {
    const savedQuestions = localStorage.getItem('dailyQuestions')
    if (savedQuestions) {
      const parsed = JSON.parse(savedQuestions)
      setExistingQuestions(parsed)
      setQuestions(parsed)
    }
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
      id: Date.now().toString(),
      question: '',
      date: today.toISOString().split('T')[0],
      adminName: 'Current Admin',
      adminId: 'admin01',
      status: 'draft'
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

  const handleSave = async () => {
    const validQuestions = questions.filter(q => q.question.trim())
    
    if (validQuestions.length === 0) return

    setIsSaving(true)
    
    try {
      // Create new question item with admin01
      const newQuestionItem = createNewQuestionItem(validQuestions)
      
      // Save to JSON API
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newQuestionItem),
      })
      
      if (response.ok) {
        // Also save to localStorage for current session
        localStorage.setItem('dailyQuestions', JSON.stringify(validQuestions))
        setExistingQuestions(validQuestions)
        
        // Emit event for other components
        window.dispatchEvent(new CustomEvent('newQuestion', { detail: newQuestionItem }))
        
        onQuestionSaved(validQuestions)
      } else {
        throw new Error('Failed to save to server')
      }
    } catch (error) {
      console.error('Failed to save questions:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async () => {
    const validQuestions = questions.filter(q => q.question.trim())
    
    if (validQuestions.length === 0) return

    setIsSaving(true)
    
    try {
      // Create question item with admin01
      const newQuestionItem = createNewQuestionItem(validQuestions)
      
      // Save to JSON API (use POST for both new and updated questions)
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newQuestionItem),
      })
      
      if (response.ok) {
        // Also save to localStorage for current session
        localStorage.setItem('dailyQuestions', JSON.stringify(validQuestions))
        setExistingQuestions(validQuestions)
        
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

  const isNewQuestions = existingQuestions.length === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          {isNewQuestions ? 'Create Questions' : 'Update Questions'}
        </CardTitle>
        <CardDescription>
          {isNewQuestions 
            ? 'Add discussion questions for today' 
            : 'Edit today\'s questions'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No questions added yet</p>
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
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Status
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="draft"
                            checked={q.status === 'draft'}
                            onChange={(e) => updateQuestion(q.id, 'status', e.target.value as 'draft')}
                            className="mr-2"
                          />
                          <span className="text-sm">Draft</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="published"
                            checked={q.status === 'published'}
                            onChange={(e) => updateQuestion(q.id, 'status', e.target.value as 'published')}
                            className="mr-2"
                          />
                          <span className="text-sm">Published</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {questions.length > 0 && (
          <div className="flex gap-3 pt-4 border-t">
            {isNewQuestions ? (
              <Button 
                onClick={handleSave} 
                disabled={isSaving || questions.filter(q => q.question.trim()).length === 0}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Question'}
              </Button>
            ) : (
              <Button 
                onClick={handleUpdate} 
                disabled={isSaving || questions.filter(q => q.question.trim()).length === 0}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Updating...' : 'Save'}
              </Button>
            )}
            
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
                <div key={q.id} className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
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
