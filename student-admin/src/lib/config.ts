// Application configuration
export const config = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  APP_NAME: 'Student Admin Portal',
  VERSION: '1.0.0',
}

// Development fallbacks
export const devConfig = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
}
