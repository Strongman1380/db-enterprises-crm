import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDoc, query, where,
  serverTimestamp, onSnapshot
} from 'firebase/firestore'
import { db } from './firebase'

const COLLECTION = 'contacts'
const timestampMillis = (value) => value?.seconds ? value.seconds * 1000 : 0

export const subscribeToContacts = (userId, callback) => {
  const q = query(
    collection(db, COLLECTION),
    where('createdBy', '==', userId)
  )
  return onSnapshot(q, (snapshot) => {
    const contacts = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt))
    callback(contacts)
  })
}

export const createContact = async (data, userId) => {
  return addDoc(collection(db, COLLECTION), {
    ...data,
    createdBy: userId,
    updatedBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const updateContact = async (id, data, userId) => {
  return updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  })
}

export const deleteContact = async (id) => {
  return deleteDoc(doc(db, COLLECTION, id))
}

export const getContact = async (id) => {
  const snap = await getDoc(doc(db, COLLECTION, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const addActivityToContact = async (contactId, activity, userId) => {
  const contact = await getContact(contactId)
  const activities = contact?.activities || []
  return updateContact(contactId, {
    activities: [...activities, { ...activity, timestamp: new Date().toISOString() }],
  }, userId)
}
