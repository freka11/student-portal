import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

function readJsonFile<T>(fileName: string, fallback: T): T {
  const filePath = path.join(process.cwd(), 'data', fileName)
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    return fallback
  }
}

function writeJsonFile(fileName: string, data: unknown) {
  const dirPath = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
  const filePath = path.join(dirPath, fileName)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

export async function GET() {
  try {
    const questions = readJsonFile<any[]>('questions.json', [])
    return NextResponse.json(questions)
  } catch (error) {
    console.error('Error reading questions:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const newQuestionData = await request.json()
    const existing = readJsonFile<any[]>('questions.json', [])
    existing.unshift(newQuestionData)
    writeJsonFile('questions.json', existing)
    return NextResponse.json({ success: true, message: 'Question saved successfully' })
  } catch (error) {
    console.error('Error saving question:', error)
    return NextResponse.json({ success: false, message: 'Failed to save question' }, { status: 500 })
  }
}
