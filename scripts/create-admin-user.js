/**
 * Run this ONCE after setting up your .env file to create the admin login.
 * Usage: node scripts/create-admin-user.js
 */

import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
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

const EMAIL = process.env.ADMIN_EMAIL || env.ADMIN_EMAIL
const PASSWORD = process.env.ADMIN_PASSWORD || env.ADMIN_PASSWORD

if (!EMAIL || !PASSWORD) {
  console.error('\nAdmin credentials missing. Set ADMIN_EMAIL and ADMIN_PASSWORD in your shell or .env file.\n')
  process.exit(1)
}

try {
  const { user } = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD)
  console.log(`\n✓ Admin user created successfully`)
  console.log(`  Email:    ${EMAIL}`)
  console.log(`  UID:      ${user.uid}`)
  console.log(`\nYou can now sign in to the app with those credentials.\n`)
} catch (err) {
  if (err.code === 'auth/email-already-in-use') {
    try {
      const { user } = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD)
      console.log(`\n✓ Admin user already exists and the password was verified`)
      console.log(`  Email:    ${EMAIL}`)
      console.log(`  UID:      ${user.uid}`)
      console.log(`\nYou can sign in to the app with those credentials.\n`)
    } catch (signInErr) {
      console.error(`\n✗ User ${EMAIL} already exists, but this password did not verify.`)
      console.error(`  Firebase error: ${signInErr.code || signInErr.message}`)
      console.error(`  Reset this user's password in Firebase Authentication, or provide the correct ADMIN_PASSWORD.\n`)
      process.exit(1)
    }
  } else {
    console.error(`\n✗ Error: ${err.message}\n`)
    process.exit(1)
  }
}

process.exit(0)
