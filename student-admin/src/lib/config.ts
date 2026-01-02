// Application configuration
export const config = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://your-api-domain.com/api',
  APP_NAME: 'Student Admin Portal',
  VERSION: '1.0.0',
}

// Development fallbacks
export const devConfig = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
}
