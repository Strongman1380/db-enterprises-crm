import { describe, expect, it } from 'vitest'
import { getFirebaseConfig } from './firebaseConfig'

describe('getFirebaseConfig', () => {
  it('throws when required Firebase values are missing', () => {
    expect(() => getFirebaseConfig({})).toThrow(/Missing Firebase configuration/)
  })

  it('throws when placeholder values are used', () => {
    expect(() => getFirebaseConfig({
      VITE_FIREBASE_API_KEY: 'your_api_key_here',
      VITE_FIREBASE_AUTH_DOMAIN: 'db-enterprises-crm.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'db-enterprises-crm',
      VITE_FIREBASE_STORAGE_BUCKET: 'db-enterprises-crm.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: 'your_sender_id',
      VITE_FIREBASE_APP_ID: 'your_app_id',
    })).toThrow(/placeholder/)
  })

  it('returns the Firebase app config shape', () => {
    expect(getFirebaseConfig({
      VITE_FIREBASE_API_KEY: 'api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'example.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'project-id',
      VITE_FIREBASE_STORAGE_BUCKET: 'project-id.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '123456',
      VITE_FIREBASE_APP_ID: 'app-id',
    })).toEqual({
      apiKey: 'api-key',
      authDomain: 'example.firebaseapp.com',
      projectId: 'project-id',
      storageBucket: 'project-id.appspot.com',
      messagingSenderId: '123456',
      appId: 'app-id',
    })
  })
})
