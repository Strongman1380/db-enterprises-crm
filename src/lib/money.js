const roundCents = (value) => Math.round((Number(value) || 0) * 100)

export const centsToDollars = (cents) => Math.round(cents) / 100

export const parseMoneyToCents = (value) => {
  if (typeof value === 'number') return roundCents(value)
  const normalized = String(value || '').replace(/[$,\s]/g, '')
  return roundCents(Number.parseFloat(normalized))
}

export const parseQuantity = (value) => Number.parseFloat(value) || 0

export const calculateLineTotalCents = (qty, unitPrice) => {
  return Math.round(parseQuantity(qty) * parseMoneyToCents(unitPrice))
}

export const calculateLaborLineTotalCents = (ratePerSqft, squareFeet) => {
  return Math.round(parseQuantity(squareFeet) * parseMoneyToCents(ratePerSqft))
}

export const calculateTotals = ({ laborItems = [], lineItems = [], taxRate = 0 } = {}) => {
  const laborTotalCents = laborItems.reduce((sum, row) => {
    return sum + calculateLaborLineTotalCents(row.ratePerSqft, row.squareFeet)
  }, 0)

  const materialsTotalCents = lineItems.reduce((sum, row) => {
    return sum + calculateLineTotalCents(row.qty, row.unitPrice)
  }, 0)

  const subtotalCents = laborTotalCents + materialsTotalCents
  const taxAmountCents = Math.round(subtotalCents * (parseQuantity(taxRate) / 100))
  const totalCents = subtotalCents + taxAmountCents

  return {
    laborTotal: centsToDollars(laborTotalCents),
    materialsTotal: centsToDollars(materialsTotalCents),
    subtotal: centsToDollars(subtotalCents),
    taxAmount: centsToDollars(taxAmountCents),
    total: centsToDollars(totalCents),
  }
}
