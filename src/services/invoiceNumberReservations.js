import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { formatInvoiceNumber } from './invoiceNumbers'

export async function reserveInvoiceNumber(date = new Date()) {
  const counterRef = doc(db, 'counters', 'invoices')

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(counterRef)
    const nextSequence = (snapshot.exists() ? snapshot.data().sequence || 0 : 0) + 1

    transaction.set(counterRef, {
      sequence: nextSequence,
      updatedAt: serverTimestamp(),
    }, { merge: true })

    return formatInvoiceNumber(nextSequence, date)
  })
}
