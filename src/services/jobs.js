import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDoc, query, where, onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { calculateTotals } from '../lib/money'

const COLLECTION = 'jobs'
const timestampMillis = (value) => value?.seconds ? value.seconds * 1000 : 0

export const subscribeToJobs = (userId, callback) => {
  const q = query(
    collection(db, COLLECTION),
    where('createdBy', '==', userId)
  )
  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt))
    callback(jobs)
  })
}

export const createJob = async (data, userId) => {
  return addDoc(collection(db, COLLECTION), {
    ...data,
    createdBy: userId,
    updatedBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const updateJob = async (id, data, userId) => {
  return updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedBy: userId,
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
  return calculateTotals({
    laborItems: job.laborItems || [{ ratePerSqft: job.baseRate, squareFeet: job.squareFeet }],
    lineItems: job.lineItems || [],
    taxRate: job.taxRate,
  })
}
