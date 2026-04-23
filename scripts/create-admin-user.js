/**
 * Run this ONCE after setting up your .env file to create the admin login.
 * Usage: node scripts/create-admin-user.js
 */

import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// Load .env manually
const envPath = resolve(__dir, '../.env')
let env = {}
try {
  const raw = readFileSync(envPath, 'utf8')
  raw.split('\n').forEach(line => {
    const [k, ...v] = line.split('=')
    if (k && v.length) env[k.trim()] = v.join('=').trim()
  })
} catch {
  console.error('No .env file found. Copy .env.example to .env and fill in your Firebase credentials first.')
  process.exit(1)
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your_api_key_here') {
  console.error('Firebase credentials missing. Fill in your .env file first.')
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

const EMAIL = env.ADMIN_EMAIL || 'admin@example.com'
const PASSWORD = env.ADMIN_PASSWORD || 'password123'

try {
  const { user } = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD)
  console.log(`\n✓ Admin user created successfully`)
  console.log(`  Email:    ${EMAIL}`)
  console.log(`  UID:      ${user.uid}`)
  console.log(`\nYou can now sign in to the app with those credentials.\n`)
} catch (err) {
  if (err.code === 'auth/email-already-in-use') {
    console.log(`\n✓ User ${EMAIL} already exists — you're good to go.\n`)
  } else {
    console.error(`\n✗ Error: ${err.message}\n`)
    process.exit(1)
  }
}

process.exit(0)
