import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Plus, FileText, Download, Send, CheckCircle,
  Trash2, Edit2, Eye, Clock, AlertCircle, X
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { createInvoice, updateInvoice, deleteInvoice, generateInvoiceNumber } from '../services/invoices'
import { generateInvoicePDF } from '../services/pdfService'
import { invoiceSchema, validate } from '../lib/schemas'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
const num = (v) => parseFloat(v) || 0

const MATERIAL_PRESETS = [
  'Labor',
  'Shingles (per square)',
  'Felt / Underlayment',
  'Drip Edge',
  'Ridge Cap',
  'Pipe Boots / Flashing',
  'Decking / Plywood',
  'Nails & Fasteners',
  'Ice & Water Shield',
  'Gutters (per LF)',
  'Siding (per sqft)',
  'Fascia / Soffit',
  'Insulation',
  'Caulk & Sealant',
  'Disposal / Haul-off',
  'Permits & Fees',
  'Equipment / Rental',
  'Subcontractor',
  'Custom…',
]

function InvoiceForm({ initial = {}, jobs = [], contacts = [], onSubmit, onClose }) {
  const [form, setForm] = useState({
    invoiceNumber: initial.invoiceNumber || generateInvoiceNumber(),
    jobId: initial.jobId || '',
    clientName: initial.clientName || '',
    clientEmail: initial.clientEmail || '',
    clientAddress: initial.clientAddress || '',
    issueDate: initial.issueDate || new Date().toISOString().slice(0, 10),
    dueDate: initial.dueDate || (() => {
      const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10)
    })(),
    taxRate: initial.taxRate || '0',
    notes: initial.notes || 'Thank you for your business!',
    status: initial.status || 'draft',
  })
  const [lineItems, setLineItems] = useState(
    initial.lineItems?.length
      ? initial.lineItems
      : [{ preset: '', description: '', qty: 1, unitPrice: '' }]
  )
  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }))
  }

  const applyJob = (jobId) => {
    set('jobId', jobId)
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    set('clientName', job.clientName || '')
    set('clientAddress', job.address || '')
    set('taxRate', job.taxRate || '0')
    const items = []
    // New format: laborItems array
    if (job.laborItems?.length) {
      job.laborItems.forEach(r => {
        if (r.description || r.squareFeet) {
          const lineTotal = num(r.ratePerSqft) * num(r.squareFeet)
          const desc = r.description
            ? `${r.description}${r.squareFeet ? ` — ${Number(r.squareFeet).toLocaleString()} sqft @ $${r.ratePerSqft}/sqft` : ''}`
            : `Labor — ${Number(r.squareFeet).toLocaleString()} sqft @ $${r.ratePerSqft}/sqft`
          items.push({ preset: 'Labor', description: desc, qty: 1, unitPrice: lineTotal })
        }
      })
    }
    // Materials/line items from job
    ;(job.lineItems || []).forEach(li => {
      const desc = li.description || li.preset || ''
      if (desc) items.push({ preset: li.preset || '', description: desc, qty: li.qty || 1, unitPrice: li.unitPrice || 0 })
    })
    if (items.length) setLineItems(items)
  }

  const addLine = () => setLineItems(r => [...r, { preset: '', description: '', qty: 1, unitPrice: '' }])
  const removeLine = (i) => setLineItems(r => r.filter((_, idx) => idx !== i))
  const updateLine = (i, field, value) => setLineItems(r => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  const handlePreset = (i, preset) => {
    setLineItems(r => r.map((row, idx) => idx === i
      ? { ...row, preset, description: preset !== 'Custom…' ? preset : '' }
      : row
    ))
  }

  const subtotal = lineItems.reduce((s, li) => s + num(li.qty) * num(li.unitPrice), 0)
  const taxAmount = subtotal * (num(form.taxRate) / 100)
  const total = subtotal + taxAmount

  const handleSubmit = (e) => {
    e.preventDefault()
    const fieldErrors = validate(invoiceSchema, { ...form, lineItems })
    if (fieldErrors) { setErrors(fieldErrors); return }

    const cleanItems = lineItems.map(li => ({
      preset: li.preset || '',
      description: li.description || (li.preset && li.preset !== 'Custom…' ? li.preset : '') || '',
      qty: num(li.qty) || 1,
      unitPrice: num(li.unitPrice) || 0,
    }))

    onClose()
    onSubmit({ ...form, lineItems: cleanItems, subtotal, taxAmount, total })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {jobs.length > 0 && (
        <div>
          <label className="label">Import from Job (optional)</label>
          <select className="input-field" value={form.jobId} onChange={e => applyJob(e.target.value)}>
            <option value="">— Start from scratch —</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}{j.clientName ? ` — ${j.clientName}` : ''}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Invoice Number</label>
          <input
            className={`input-field ${errors.invoiceNumber ? 'border-red-400' : ''}`}
            value={form.invoiceNumber}
            onChange={e => set('invoiceNumber', e.target.value)}
          />
          {errors.invoiceNumber && <p className="text-xs text-red-500 mt-1">{errors.invoiceNumber}</p>}
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input-field" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div>
          <label className="label">Client Name *</label>
          <input
            className={`input-field ${errors.clientName ? 'border-red-400' : ''}`}
            value={form.clientName}
            onChange={e => set('clientName', e.target.value)}
          />
          {errors.clientName && <p className="text-xs text-red-500 mt-1">{errors.clientName}</p>}
        </div>
        <div>
          <label className="label">Client Email</label>
          <input
            className={`input-field ${errors.clientEmail ? 'border-red-400' : ''}`}
            type="email"
            value={form.clientEmail}
            onChange={e => set('clientEmail', e.target.value)}
          />
          {errors.clientEmail && <p className="text-xs text-red-500 mt-1">{errors.clientEmail}</p>}
        </div>
        <div className="col-span-2">
          <label className="label">Client Address</label>
          <input className="input-field" value={form.clientAddress} onChange={e => set('clientAddress', e.target.value)} />
        </div>
        <div>
          <label className="label">Issue Date</label>
          <input className="input-field" type="date" value={form.issueDate} onChange={e => set('issueDate', e.target.value)} />
        </div>
        <div>
          <label className="label">Due Date</label>
          <input className="input-field" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
        </div>
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Line Items</label>
          <button type="button" onClick={addLine} className="text-xs text-navy font-medium hover:underline flex items-center gap-1">
            <Plus size={12} /> Add Line
          </button>
        </div>
        <div className="space-y-2">
          {lineItems.map((item, i) => {
            const isCustom = item.preset === 'Custom…'
            const lineTotal = num(item.qty) * num(item.unitPrice)
            return (
              <div key={i} className="rounded-xl border border-ivory-300 bg-white/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-charcoal-muted font-medium">Item {i + 1}</span>
                  <button type="button" onClick={() => removeLine(i)} className="text-charcoal-muted/40 hover:text-red-400 transition-colors">
                    <X size={13} />
                  </button>
                </div>
                <select
                  className="input-field"
                  value={item.preset || ''}
                  onChange={e => handlePreset(i, e.target.value)}
                >
                  <option value="">— Select type —</option>
                  {MATERIAL_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {isCustom && (
                  <input
                    className="input-field"
                    value={item.description}
                    onChange={e => updateLine(i, 'description', e.target.value)}
                    placeholder="Describe the custom item…"
                    autoFocus
                  />
                )}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <label className="label">Qty</label>
                    <input className="input-field text-right" type="number" min="0" step="0.01" value={item.qty} onChange={e => updateLine(i, 'qty', e.target.value)} placeholder="1" />
                  </div>
                  <div className="col-span-4">
                    <label className="label">Unit Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted text-sm">$</span>
                      <input className="input-field pl-6 text-right" type="number" step="0.01" min="0" value={item.unitPrice} onChange={e => updateLine(i, 'unitPrice', e.target.value)} placeholder="0.00" />
                    </div>
                  </div>
                  <div className="col-span-5">
                    <label className="label">Line Total</label>
                    <div className="input-field bg-ivory-300/50 border-ivory-300 font-semibold text-charcoal cursor-default text-right">
                      {fmt(lineTotal)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Totals */}
      <div className="rounded-xl border border-ivory-300 bg-ivory/60 p-4">
        <div className="flex items-center gap-3 mb-2">
          <label className="label mb-0 flex-1">Tax Rate (%)</label>
          <input className="input-field w-24 text-right" type="number" step="0.1" min="0" value={form.taxRate} onChange={e => set('taxRate', e.target.value)} />
        </div>
        <div className="space-y-1 border-t border-ivory-300 pt-2">
          <div className="flex justify-between text-xs text-charcoal-muted"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
          {taxAmount > 0 && <div className="flex justify-between text-xs text-charcoal-muted"><span>Tax ({form.taxRate}%)</span><span>{fmt(taxAmount)}</span></div>}
          <div className="flex justify-between text-sm font-bold text-charcoal border-t border-ivory-300 pt-1.5"><span>Total</span><span className="text-navy">{fmt(total)}</span></div>
        </div>
      </div>

      <div>
        <label className="label">Notes / Payment Terms</label>
        <textarea className="input-field resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">
          {initial.invoiceNumber ? 'Save Changes' : 'Create Invoice'}
        </button>
      </div>
    </form>
  )
}

const handleDownloadPDF = (inv) => {
  generateInvoicePDF(inv, 'INVOICE')
}


const STATUS_CONFIG = {
  draft: { icon: FileText, cls: 'badge-draft', label: 'Draft' },
  sent: { icon: Send, cls: 'badge-sent', label: 'Sent' },
  paid: { icon: CheckCircle, cls: 'badge-paid', label: 'Paid' },
  overdue: { icon: AlertCircle, cls: 'badge-overdue', label: 'Overdue' },
}

export default function Invoices() {
  const { invoices, jobs, contacts } = useStore()
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const filtered = filterStatus === 'all' ? invoices : invoices.filter(i => i.status === filterStatus)

  const handleAdd = async (data) => {
    await toast.promise(createInvoice(data), {
      loading: 'Creating invoice…',
      success: `Invoice ${data.invoiceNumber} created`,
      error: 'Failed to create invoice',
    })
  }

  const handleEdit = async (data) => {
    await toast.promise(updateInvoice(editing.id, data), {
      loading: 'Saving…',
      success: 'Invoice updated',
      error: 'Failed to save changes',
    })
    setEditing(null)
  }

  const handleDelete = async () => {
    const num = deleting?.invoiceNumber
    await toast.promise(deleteInvoice(deleting.id), {
      loading: 'Deleting…',
      success: `Invoice ${num} deleted`,
      error: 'Failed to delete invoice',
    })
    setDeleting(null)
  }

  const markPaid = async (inv) => {
    await toast.promise(updateInvoice(inv.id, { status: 'paid' }), {
      loading: 'Updating…',
      success: `${inv.invoiceNumber} marked paid`,
      error: 'Failed to update status',
    })
  }

  const markSent = async (inv) => {
    await toast.promise(updateInvoice(inv.id, { status: 'sent' }), {
      loading: 'Updating…',
      success: `${inv.invoiceNumber} marked sent`,
      error: 'Failed to update status',
    })
  }

  return (
    <div className="p-6 page-enter">
      {/* Filters + Add */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-2 flex-1 flex-wrap">
          {['all', 'draft', 'sent', 'paid', 'overdue'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === s ? 'bg-navy text-ivory shadow-card' : 'bg-white/70 text-charcoal-muted hover:bg-white'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && (
                <span className="ml-1.5 opacity-60">
                  {invoices.filter(i => i.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary whitespace-nowrap">
          <Plus size={14} /> New Invoice
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={FileText}
            title={invoices.length === 0 ? 'No invoices yet' : 'No invoices match this filter'}
            description={invoices.length === 0 ? 'Create your first invoice to get started.' : ''}
            action={invoices.length === 0 && (
              <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={14} /> New Invoice</button>
            )}
          />
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((inv) => {
            const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft
            return (
              <motion.div
                key={inv.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-navy/8 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-navy/60" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-charcoal">{inv.invoiceNumber}</p>
                      <span className={`${cfg.cls}`}>{cfg.label}</span>
                    </div>
                    <p className="text-sm text-charcoal-muted mt-0.5">{inv.clientName}</p>
                    <p className="text-xs text-charcoal-muted">
                      Issued {inv.issueDate} · Due {inv.dueDate}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-navy">{fmt(inv.total)}</p>
                    <p className="text-xs text-charcoal-muted">{fmt(inv.subtotal)} + tax</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-ivory-300/60">
                  <button onClick={() => handleDownloadPDF(inv)} className="btn-ghost text-xs py-1.5 px-3">
                    <Download size={12} /> Download PDF
                  </button>
                  {inv.status === 'draft' && (
                    <button onClick={() => markSent(inv)} className="btn-ghost text-xs py-1.5 px-3">
                      <Send size={12} /> Mark Sent
                    </button>
                  )}
                  {inv.status === 'sent' && (
                    <button onClick={() => markPaid(inv)} className="btn-ghost text-xs py-1.5 px-3">
                      <CheckCircle size={12} className="text-emerald-500" /> Mark Paid
                    </button>
                  )}
                  <div className="ml-auto flex gap-1">
                    <button onClick={() => setEditing(inv)} className="w-7 h-7 rounded-lg hover:bg-navy/6 flex items-center justify-center transition-colors">
                      <Edit2 size={12} className="text-charcoal-muted" />
                    </button>
                    <button onClick={() => setDeleting(inv)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors">
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Invoice" width="max-w-2xl">
        <InvoiceForm jobs={jobs} contacts={contacts} onSubmit={handleAdd} onClose={() => setShowAdd(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Invoice" width="max-w-2xl">
        {editing && <InvoiceForm initial={editing} jobs={jobs} contacts={contacts} onSubmit={handleEdit} onClose={() => setEditing(null)} />}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message={`Delete invoice ${deleting?.invoiceNumber}? This cannot be undone.`}
      />
    </div>
  )
}
