/**
 * API client for backend. All student API calls go through this.
 * Set NEXT_PUBLIC_API_URL to point to backend (default: http://localhost:5000)
 */
import { getStudentIdToken } from './auth'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

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

// User login - uses /api/users/login
export async function userLogin(username: string, password: string) {
  return fetch(`${BASE}/api/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })
}

// Thoughts (public - no auth required for GET)
export const thoughts = {
  get: (date?: string) =>
    fetch(`${BASE}/api/thoughts${date ? `?date=${date}` : ''}`),
}

// Questions (public - no auth required for GET)
export const questions = {
  get: (date?: string) =>
    fetch(`${BASE}/api/questions${date ? `?date=${date}` : ''}`),
}

// Answers (requires student auth)
export const answers = {
  get: (all?: boolean) =>
    apiGet(`${all ? '/api/student/answers?all=true' : '/api/student/answers'}`),
  post: (data: { questionId: string; answer: string; publishDate?: string }) =>
    apiPost('/api/student/answers', data),
}

// Streak (requires student auth)
export const streak = {
  get: () => apiGet('/api/student/streak'),
}

// User profile (requires student auth)
export const users = {
  get: () => apiGet('/api/users'),
}
