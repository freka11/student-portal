// student-admin/src/app/api/admin/login/route.ts
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    const filePath = path.join(process.cwd(), 'data', 'admins.json')

    // Read file as UTF-8
    let fileContents = fs.readFileSync(filePath, 'utf8')

    // Remove BOM if present
    if (fileContents.charCodeAt(0) === 0xfeff) {
      fileContents = fileContents.slice(1)
    }

    const admins = JSON.parse(fileContents)

    const admin = admins.find(
      (a: any) => a.username === username && a.password === password
    )

    if (!admin) {
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Remove password before sending to client
    const { password: _, ...safeAdmin } = admin

    return NextResponse.json(
      { user: safeAdmin },
      { status: 200 }
    )

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
