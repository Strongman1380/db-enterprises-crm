const REQUIRED_ENV = {
  VITE_FIREBASE_API_KEY: 'apiKey',
  VITE_FIREBASE_AUTH_DOMAIN: 'authDomain',
  VITE_FIREBASE_PROJECT_ID: 'projectId',
  VITE_FIREBASE_STORAGE_BUCKET: 'storageBucket',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'messagingSenderId',
  VITE_FIREBASE_APP_ID: 'appId',
}

const PLACEHOLDERS = new Set([
  'YOUR_API_KEY',
  'YOUR_SENDER_ID',
  'YOUR_APP_ID',
  'your_api_key_here',
  'your_sender_id',
  'your_app_id',
])

export function getFirebaseConfig(env) {
  const missing = Object.keys(REQUIRED_ENV).filter((key) => !env[key])
  if (missing.length > 0) {
    throw new Error(`Missing Firebase configuration: ${missing.join(', ')}`)
  }

  const placeholders = Object.keys(REQUIRED_ENV).filter((key) => PLACEHOLDERS.has(env[key]))
  if (placeholders.length > 0) {
    throw new Error(`Firebase configuration contains placeholder values: ${placeholders.join(', ')}`)
  }

  return Object.fromEntries(
    Object.entries(REQUIRED_ENV).map(([envKey, configKey]) => [configKey, env[envKey]])
  )
}
