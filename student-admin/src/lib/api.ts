// API configuration and utilities
import { config } from './config'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Data types
export interface Thought {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: string
  content: string
  status: 'published' | 'draft'
  createdAt: string
  updatedAt: string
}

export interface Student {
  id: string
  name: string
  avatar: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isOnline: boolean
}

export interface Message {
  id: string
  content: string
  timestamp: string
  isSent: boolean
}

export interface DashboardStats {
  totalStudents: number
  activeChats: number
  thoughtsPosted: number
  questionsAsked: number
}

// Generic API client
class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return {
        success: true,
        data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient(config.API_BASE_URL)

// API endpoints
export const api = {
  // Dashboard
  getDashboardStats: () => apiClient.get<DashboardStats>('/dashboard/stats'),
  
  // Thoughts
  getThoughts: () => apiClient.get<Thought[]>('/thoughts'),
  createThought: (data: { content: string }) => apiClient.post<Thought>('/thoughts', data),
  updateThought: (id: string, data: { content: string }) => apiClient.put<Thought>(`/thoughts/${id}`, data),
  deleteThought: (id: string) => apiClient.delete<void>(`/thoughts/${id}`),
  
  // Questions
  getQuestions: () => apiClient.get<Question[]>('/questions'),
  createQuestion: (data: { content: string; status: 'published' | 'draft' }) => apiClient.post<Question>('/questions', data),
  updateQuestion: (id: string, data: { content: string; status: 'published' | 'draft' }) => apiClient.put<Question>(`/questions/${id}`, data),
  deleteQuestion: (id: string) => apiClient.delete<void>(`/questions/${id}`),
  
  // Students
  getStudents: () => apiClient.get<Student[]>('/students'),
  getStudentMessages: (studentId: string) => apiClient.get<Message[]>(`/students/${studentId}/messages`),
  sendMessage: (studentId: string, data: { content: string }) => apiClient.post<Message>(`/students/${studentId}/messages`, data),
}
