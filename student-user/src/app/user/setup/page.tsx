'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { Users, CheckCircle, AlertCircle } from 'lucide-react'

interface UserResult {
  username: string
  email: string
  role: string
  status: string
  uid?: string
  error?: string
}

interface SetupResponse {
  success: boolean
  message: string
  results: UserResult[]
  totalUsers: number
  successCount: number
}

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SetupResponse | null>(null)
  const { addToast, ToastContainer } = useToast()

  const handleSetupUsers = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/setup-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data: SetupResponse = await response.json()

      if (response.ok) {
        setResult(data)
        addToast(`Setup completed! ${data.successCount}/${data.totalUsers} users created successfully.`, 'success')
      } else {
        addToast(data.message || 'Setup failed', 'error')
        setResult(data)
      }
    } catch (error) {
      console.error('Setup error:', error)
      addToast('Failed to run setup', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckUsers = async () => {
    try {
      const response = await fetch('/api/setup-users')
      const data = await response.json()

      if (response.ok) {
        addToast(`Found ${data.totalUsers} users (${data.students?.length || 0} students, ${data.admins?.length || 0} admins)`, 'success')
      } else {
        addToast('Failed to check users', 'error')
      }
    } catch (error) {
      console.error('Check users error:', error)
      addToast('Failed to check users', 'error')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ToastContainer />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat System Setup</h1>
        <p className="text-gray-600">
          Create test users for the chat system. This will create 4 users: Student 1, Student 2, Teacher 1, Teacher 2.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Setup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Create Test Users
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Users that will be created:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Student 1 (student1@student.com) - Password: student123</li>
                <li>• Student 2 (student2@student.com) - Password: student123</li>
                <li>• Teacher 1 (teacher1@admin.com) - Password: teacher123</li>
                <li>• Teacher 2 (teacher2@admin.com) - Password: teacher123</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSetupUsers}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Creating Users...' : 'Create Test Users'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCheckUsers}
                disabled={loading}
              >
                Check Users
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                Setup Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Users:</span>
                  <span>{result.successCount}/{result.totalUsers}</span>
                </div>

                <div className="space-y-2">
                  {result.results.map((user, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        user.status === 'success'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">Role: {user.role}</p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            user.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.status}
                        </span>
                      </div>
                      {user.error && (
                        <p className="text-sm text-red-600 mt-2">{user.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Run the setup to create test users</li>
          <li>Go to <strong>Student Login</strong> and login with student1/student123 or student2/student123</li>
          <li>Go to <strong>Admin Login</strong> and login with teacher1/teacher123 or teacher2/teacher123</li>
          <li>Navigate to the chat pages to test messaging</li>
        </ol>
      </div>
    </div>
  )
}
