import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDoc, query, where, onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { reserveInvoiceNumber } from './invoiceNumberReservations'

const COLLECTION = 'invoices'
const timestampMillis = (value) => value?.seconds ? value.seconds * 1000 : 0

export const subscribeToInvoices = (userId, callback) => {
  const q = query(
    collection(db, COLLECTION),
    where('createdBy', '==', userId)
  )
  return onSnapshot(q, (snapshot) => {
    const invoices = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt))
    callback(invoices)
  })
}

export const createInvoice = async (data, userId) => {
  const invoiceNumber = data.invoiceNumber || await reserveInvoiceNumber()

  return addDoc(collection(db, COLLECTION), {
    ...data,
    invoiceNumber,
    status: data.status || 'draft',
    createdBy: userId,
    updatedBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const updateInvoice = async (id, data, userId) => {
  return updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedBy: userId,
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

export { formatInvoiceNumber as generateInvoiceNumber } from './invoiceNumbers'
