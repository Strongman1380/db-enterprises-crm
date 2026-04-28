import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
  phone: z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  type: z.enum(['lead', 'customer', 'prospect']),
  status: z.enum(['new', 'hot', 'warm', 'cold', 'follow_up', 'won', 'lost']).optional(),
  pipeline: z.enum(['new', 'contacted', 'estimate_scheduled', 'estimate_sent', 'contract_sent', 'won', 'lost']).optional(),
  source: z.enum(['referral', 'google', 'door_knock', 'yard_sign', 'social_media', 'repeat_customer', 'other', '']).optional(),
  followUpDate: z.string().optional().or(z.literal('')),
  estimatedValue: z.union([z.number(), z.string()]).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

export const lineItemSchema = z.object({
  description: z.string().optional().or(z.literal('')),
  qty: z.union([z.number(), z.string()]),
  unitPrice: z.union([z.number(), z.string()]),
})

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  clientName: z.string().min(1, 'Client name is required').max(100),
  clientEmail: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
  clientAddress: z.string().max(200).optional().or(z.literal('')),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  taxRate: z.union([z.number(), z.string()]).optional(),
  notes: z.string().max(2000).optional().or(z.literal('')),
  status: z.enum(['draft', 'sent', 'partial', 'paid', 'overdue']),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
})

// Returns { errors: { field: message } } or null
export function validate(schema, data) {
  const result = schema.safeParse(data)
  if (result.success) return null
  const errors = {}
  result.error.issues.forEach((e) => {
    const key = e.path[0]
    if (key && !errors[key]) errors[key] = e.message
  })
  return errors
}
