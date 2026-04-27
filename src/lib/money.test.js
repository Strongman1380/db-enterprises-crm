import { describe, expect, it } from 'vitest'
import { calculateLineTotalCents, calculateTotals, parseMoneyToCents } from './money'

describe('money helpers', () => {
  it('parses decimal money values to integer cents', () => {
    expect(parseMoneyToCents('12.34')).toBe(1234)
    expect(parseMoneyToCents('$1,250.5')).toBe(125050)
    expect(parseMoneyToCents('')).toBe(0)
  })

  it('calculates line totals without floating point drift', () => {
    expect(calculateLineTotalCents('3', '0.10')).toBe(30)
  })

  it('calculates labor, materials, tax, and total values', () => {
    const totals = calculateTotals({
      laborItems: [{ ratePerSqft: '2.50', squareFeet: '100' }],
      lineItems: [{ qty: '2', unitPrice: '19.99' }],
      taxRate: '7.5',
    })

    expect(totals).toEqual({
      laborTotal: 250,
      materialsTotal: 39.98,
      subtotal: 289.98,
      taxAmount: 21.75,
      total: 311.73,
    })
  })
})
