export function formatInvoiceNumber(sequence, date = new Date()) {
  const year = date.getFullYear().toString().slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const padded = String(sequence).padStart(4, '0')
  return `DBE-${year}${month}-${padded}`
}
