import { describe, expect, it } from 'vitest'
import { formatInvoiceNumber } from './invoiceNumbers'

describe('formatInvoiceNumber', () => {
  it('formats invoice numbers with year, month, and padded sequence', () => {
    expect(formatInvoiceNumber(7, new Date('2026-04-26T12:00:00Z'))).toBe('DBE-2604-0007')
  })
})
