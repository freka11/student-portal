import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'thoughts.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const thoughts = JSON.parse(fileContents)
    
    return NextResponse.json(thoughts)
  } catch (error) {
    console.error('Error reading thoughts:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const newThoughtData = await request.json()
    const filePath = path.join(process.cwd(), 'data', 'thoughts.json')
    
    // Read existing thoughts
    let existingThoughts = []
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8')
      existingThoughts = JSON.parse(fileContents)
    } catch (error) {
      // File doesn't exist or is empty
      existingThoughts = []
    }
    
    // Add new thought to the beginning
    existingThoughts.unshift(newThoughtData)
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(existingThoughts, null, 2))
    
    return NextResponse.json({ success: true, message: 'Thought saved successfully' })
  } catch (error) {
    console.error('Error saving thought:', error)
    return NextResponse.json({ success: false, message: 'Failed to save thought' }, { status: 500 })
  }
}
