/**
 * API client for backend. All admin API calls go through this.
 * Set NEXT_PUBLIC_API_BASE_URL to point to backend (default: http://localhost:4000)
 */
import { getAdminIdToken } from './auth'

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'
const ADMIN_PREFIX = '/api/admin'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAdminIdToken()
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

export async function apiPut(path: string, body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })
  return res
}

export async function apiPatch(path: string, body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })
  return res
}

export async function apiDelete(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
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

// Thoughts
export const thoughts = {
  get: (date?: string) =>
    apiGet(`${ADMIN_PREFIX}/thoughts${date ? `?date=${date}` : ''}`),
  post: (data: { thought?: string; text?: string }) =>
    apiPost(`${ADMIN_PREFIX}/thoughts`, data.thought ? { thought: data.thought } : { text: data.text }),
  put: (id: string, text: string) => apiPut(`${ADMIN_PREFIX}/thoughts/${id}`, { text }),
  delete: (id: string) => apiDelete(`${ADMIN_PREFIX}/thoughts/${id}`),
}

// Questions
export const questions = {
  get: (date?: string) =>
    apiGet(`${ADMIN_PREFIX}/questions${date ? `?date=${date}` : ''}`),
  post: (data: { question?: string; text?: string; status?: string }) =>
    apiPost(`${ADMIN_PREFIX}/questions`, {
      question: data.question ?? data.text,
      status: data.status,
    }),
  put: (id: string, data: { question?: string; text?: string; status?: string }) =>
    apiPut(`${ADMIN_PREFIX}/questions/${id}`, {
      text: data.text ?? data.question,
      status: data.status,
    }),
  patchStatus: (id: string, status: 'draft' | 'published') =>
    apiPatch(`${ADMIN_PREFIX}/questions/${id}/status`, { status }),
  delete: (id: string) => apiDelete(`${ADMIN_PREFIX}/questions/${id}`),
}

// Answers
export const answers = {
  get: () => apiGet(`${ADMIN_PREFIX}/answers`),
  delete: (id: string) => apiDelete(`${ADMIN_PREFIX}/answers?id=${id}`),
}

// Users
export const users = {
  list: () => apiGet(`${ADMIN_PREFIX}/users`),
  createTeacher: (data: { email: string; password?: string; name: string }) =>
    apiPost(`${ADMIN_PREFIX}/users/create-teacher`, data),
  promoteToSuperAdmin: (uid: string) =>
    apiPost(`${ADMIN_PREFIX}/users/promote-superadmin`, { uid }),
}

// Conversations
export const conversations = {
  assign: (data: { conversationId: string; teacherId: string | null; assignedBy: string }) =>
    apiPost(`${ADMIN_PREFIX}/conversations/assign`, data),
}
