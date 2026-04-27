import { describe, expect, it } from 'vitest'
import { invoiceSchema, validate } from './schemas'

const baseInvoice = {
  invoiceNumber: 'DBE-2604-0001',
  clientName: 'Test Customer',
  clientEmail: '',
  clientAddress: '',
  issueDate: '2026-04-26',
  dueDate: '2026-05-26',
  taxRate: '0',
  notes: '',
  lineItems: [{ description: 'Concrete', qty: 1, unitPrice: 100 }],
}

describe('invoiceSchema', () => {
  it('accepts partially paid invoices', () => {
    expect(validate(invoiceSchema, { ...baseInvoice, status: 'partial' })).toBeNull()
  })

  it('rejects unknown invoice statuses', () => {
    expect(validate(invoiceSchema, { ...baseInvoice, status: 'refunded' })).toEqual({
      status: expect.any(String),
    })
  })
})
