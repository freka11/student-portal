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
    const answers = readJsonFile<any[]>('answers.json', [])
    return NextResponse.json(answers)
  } catch (error) {
    console.error('Error reading answers:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, message: 'Posting answers is disabled. Students can post comments only.' },
    { status: 405 }
  )
}
