// student-admin/src/lib/auth.ts
export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  const user = localStorage.getItem('adminUser')
  return user ? JSON.parse(user) : null
}

export function isAuthenticated() {
  return !!getCurrentUser()
}

export function logout() {
  localStorage.removeItem('adminUser')
  window.location.href = '/admin/login'
}