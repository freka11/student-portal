/**
 * API client for backend. All admin API calls go through this.
 * Set NEXT_PUBLIC_API_BASE_URL to point to backend (default: http://localhost:4000)
 */
import { getStudentIdToken } from './auth'

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'
const STUDENT_PREFIX = '/api/student'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getStudentIdToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export async function apiGet(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: await getAuthHeaders(),
  })
  return res
}

export async function apiPost(path: string, body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })
  return res
}

// ... (apiPut, apiPatch, apiDelete remain the same if needed, but student mostly uses GET/POST)

// Auth - uses /api/auth
export async function authSessionPost(token: string) {
  return fetch(`${BASE}/api/auth/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

// Thoughts
export const thoughts = {
  get: (date?: string) =>
    apiGet(`${STUDENT_PREFIX}/thoughts${date ? `?date=${date}` : ''}`),
}

// Questions
export const questions = {
  get: (date?: string) =>
    apiGet(`${STUDENT_PREFIX}/questions${date ? `?date=${date}` : ''}`),
}

// Answers
export const answers = {
  get: (all?: boolean) => apiGet(`${STUDENT_PREFIX}/answers${all ? '?all=true' : ''}`),
  post: (data: { questionId: string; answer: string; publishDate?: string }) =>
    apiPost(`${STUDENT_PREFIX}/answers`, data),
}

// Streak
export const streak = {
  get: () => apiGet(`${STUDENT_PREFIX}/streak`),
}
