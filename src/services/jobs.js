import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDoc, query, orderBy, onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

const COLLECTION = 'jobs'

export const subscribeToJobs = (callback) => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(jobs)
  })
}

export const createJob = async (data) => {
  return addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const updateJob = async (id, data) => {
  return updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export const deleteJob = async (id) => {
  return deleteDoc(doc(db, COLLECTION, id))
}

export const getJob = async (id) => {
  const snap = await getDoc(doc(db, COLLECTION, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Calculate job totals from line items
export const calculateJobTotals = (job) => {
  const sqft = parseFloat(job.squareFeet) || 0
  const baseRate = parseFloat(job.baseRate) || 0
  const laborTotal = sqft * baseRate

  const materialsTotal = (job.lineItems || []).reduce((sum, item) => {
    return sum + (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0)
  }, 0)

  const subtotal = laborTotal + materialsTotal
  const taxRate = parseFloat(job.taxRate) || 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  return { laborTotal, materialsTotal, subtotal, taxAmount, total }
}
