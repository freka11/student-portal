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
    const thoughts = readJsonFile<any[]>('thoughts.json', [])
    return NextResponse.json(thoughts)
  } catch (error) {
    console.error('Error reading thoughts:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const newThought = await request.json()
    const existing = readJsonFile<any[]>('thoughts.json', [])
    existing.unshift(newThought)
    writeJsonFile('thoughts.json', existing)
    return NextResponse.json({ success: true, message: 'Thought saved successfully' })
  } catch (error) {
    console.error('Error saving thought:', error)
    return NextResponse.json({ success: false, message: 'Failed to save thought' }, { status: 500 })
  }
}
