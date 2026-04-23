import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDoc, query, orderBy, onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

const COLLECTION = 'invoices'

export const subscribeToInvoices = (callback) => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const invoices = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(invoices)
  })
}

export const createInvoice = async (data) => {
  return addDoc(collection(db, COLLECTION), {
    ...data,
    status: data.status || 'draft',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const updateInvoice = async (id, data) => {
  return updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export const deleteInvoice = async (id) => {
  return deleteDoc(doc(db, COLLECTION, id))
}

export const getInvoice = async (id) => {
  const snap = await getDoc(doc(db, COLLECTION, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const generateInvoiceNumber = () => {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `DBE-${year}${month}-${rand}`
}
