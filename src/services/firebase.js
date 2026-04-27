import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getFirebaseConfig } from './firebaseConfig'

const firebaseConfig = getFirebaseConfig(import.meta.env)

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
export default app
