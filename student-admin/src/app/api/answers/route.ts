import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'answers.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const answers = JSON.parse(fileContents)
    
    return NextResponse.json(answers)
  } catch (error) {
    console.error('Error reading answers:', error)
    return NextResponse.json([], { status: 500 })
  }
}
