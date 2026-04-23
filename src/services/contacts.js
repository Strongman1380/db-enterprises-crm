import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, orderBy, where,
  serverTimestamp, onSnapshot
} from 'firebase/firestore'
import { db } from './firebase'

const COLLECTION = 'contacts'

export const subscribeToContacts = (callback) => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const contacts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(contacts)
  })
}

export const createContact = async (data) => {
  return addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const updateContact = async (id, data) => {
  return updateDoc(doc(db, COLLECTION, id), {
    ...data,
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

export const addActivityToContact = async (contactId, activity) => {
  const contact = await getContact(contactId)
  const activities = contact?.activities || []
  return updateContact(contactId, {
    activities: [...activities, { ...activity, timestamp: new Date().toISOString() }],
  })
}
