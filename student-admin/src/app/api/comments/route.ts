import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'comments.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const comments = JSON.parse(fileContents)
    
    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error reading comments:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const newCommentData = await request.json()
    const filePath = path.join(process.cwd(), 'data', 'comments.json')
    
    // Read existing comments
    let existingComments = []
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8')
      existingComments = JSON.parse(fileContents)
    } catch (error) {
      // File doesn't exist or is empty
      existingComments = []
    }
    
    // Add new comment to the beginning
    existingComments.unshift(newCommentData)
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(existingComments, null, 2))
    
    return NextResponse.json({ success: true, message: 'Comment added successfully' })
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json({ success: false, message: 'Failed to add comment' }, { status: 500 })
  }
}
