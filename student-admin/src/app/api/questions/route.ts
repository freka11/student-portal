import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('date')
    const filePath = path.join(process.cwd(), 'data', 'questions.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const questions = JSON.parse(fileContents)
    
    // If date=all, return all questions (for history)
    if (dateFilter === 'all') {
      return NextResponse.json(questions)
    }
    
    // Default: return only today's questions
    const today = new Date().toISOString().split('T')[0]
    const todayQuestions = questions.filter((item: any) => item.date === today)
    
    return NextResponse.json(todayQuestions)
  } catch (error) {
    console.error('Error reading questions:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const newQuestionData = await request.json()
    const filePath = path.join(process.cwd(), 'data', 'questions.json')
    
    // Read existing questions
    let existingQuestions = []
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8')
      existingQuestions = JSON.parse(fileContents)
    } catch (error) {
      // File doesn't exist or is empty
      existingQuestions = []
    }
    
    // Add new question to the beginning
    existingQuestions.unshift(newQuestionData)
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(existingQuestions, null, 2))
    
    return NextResponse.json({ success: true, message: 'Question saved successfully' })
  } catch (error) {
    console.error('Error saving question:', error)
    return NextResponse.json({ success: false, message: 'Failed to save question' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updatedQuestionData = await request.json()
    const filePath = path.join(process.cwd(), 'data', 'questions.json')
    
    // Read existing questions
    let questions = []
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8')
      questions = JSON.parse(fileContents)
    } catch (error) {
      // File doesn't exist, create new structure
      questions = []
    }
    
    // Find and update the question
    let updated = false
    for (const historyItem of questions) {
      for (let i = 0; i < historyItem.questions.length; i++) {
        if (historyItem.questions[i].id === updatedQuestionData.id) {
          historyItem.questions[i] = { ...historyItem.questions[i], ...updatedQuestionData }
          updated = true
          break
        }
      }
      if (updated) break
    }
    
    // If question not found, it might be a new question being edited before saving
    // In this case, we should add it as a new question item
    if (!updated) {
      const today = new Date().toISOString().split('T')[0]
      const newQuestionItem = {
        id: Date.now().toString(),
        date: today,
        questions: [updatedQuestionData],
        adminName: 'Current Admin',
        adminId: 'admin01'
      }
      questions.unshift(newQuestionItem)
      updated = true
    }
    
    if (updated) {
      fs.writeFileSync(filePath, JSON.stringify(questions, null, 2))
      return NextResponse.json({ success: true, message: 'Question updated successfully' })
    } else {
      return NextResponse.json({ success: false, message: 'Failed to update question' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error updating question:', error)
    return NextResponse.json({ success: false, message: 'Failed to update question' }, { status: 500 })
  }
}
