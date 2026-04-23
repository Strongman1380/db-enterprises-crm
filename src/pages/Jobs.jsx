import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Plus, Briefcase, Trash2, Edit2, Calculator, X, Download } from 'lucide-react'
import { useStore } from '../store/useStore'
import { createJob, updateJob, deleteJob } from '../services/jobs'
import { generateInvoicePDF } from '../services/pdfService'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
const num = (v) => parseFloat(v) || 0

// ─── Preset material options ───────────────────────────────────────────────
const MATERIAL_PRESETS = [
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

// ─── Totals calculator ─────────────────────────────────────────────────────
function calcTotals(laborItems, lineItems, taxRate) {
  const laborTotal = laborItems.reduce((s, r) => s + num(r.ratePerSqft) * num(r.squareFeet), 0)
  const materialsTotal = lineItems.reduce((s, r) => s + num(r.qty) * num(r.unitPrice), 0)
  const subtotal = laborTotal + materialsTotal
  const taxAmount = subtotal * (num(taxRate) / 100)
  const total = subtotal + taxAmount
  return { laborTotal, materialsTotal, subtotal, taxAmount, total }
}

// ─── Labor row ─────────────────────────────────────────────────────────────
function LaborRow({ row, onChange, onRemove, index }) {
  const rowTotal = num(row.ratePerSqft) * num(row.squareFeet)
  return (
    <div className="rounded-xl border border-navy/10 bg-white/60 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-navy uppercase tracking-wider">Labor Line {index + 1}</span>
        <button type="button" onClick={onRemove} className="text-charcoal-muted/40 hover:text-red-400 transition-colors">
          <X size={14} />
        </button>
      </div>
      <div className="grid grid-cols-12 gap-2">
        {/* Description spans full width on first row */}
        <div className="col-span-12">
          <label className="label">Description</label>
          <input
            className="input-field"
            value={row.description}
            onChange={e => onChange('description', e.target.value)}
            placeholder="e.g. Roofing job — tear-off & replace"
          />
        </div>
        <div className="col-span-4">
          <label className="label">$ / Sq Ft</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted text-sm">$</span>
            <input
              className="input-field pl-6"
              type="number" step="0.01" min="0"
              value={row.ratePerSqft}
              onChange={e => onChange('ratePerSqft', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="col-span-4">
          <label className="label">Square Feet</label>
          <input
            className="input-field"
            type="number" min="0" step="1"
            value={row.squareFeet}
            onChange={e => onChange('squareFeet', e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="col-span-4">
          <label className="label">Line Total</label>
          <div className="input-field bg-navy/4 border-navy/10 font-semibold text-navy cursor-default select-none">
            {fmt(rowTotal)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Material row ──────────────────────────────────────────────────────────
function MaterialRow({ row, onChange, onRemove, index }) {
  const rowTotal = num(row.qty) * num(row.unitPrice)
  const isCustom = row.preset === 'Custom…'

  const handlePresetChange = (preset) => {
    onChange('preset', preset)
    if (preset !== 'Custom…') onChange('description', preset)
    else onChange('description', '')
  }

  return (
    <div className="rounded-xl border border-ivory-300 bg-white/50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Material / Charge {index + 1}</span>
        <button type="button" onClick={onRemove} className="text-charcoal-muted/40 hover:text-red-400 transition-colors">
          <X size={14} />
        </button>
      </div>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-12">
          <label className="label">Description</label>
          <select
            className="input-field"
            value={row.preset || ''}
            onChange={e => handlePresetChange(e.target.value)}
          >
            <option value="">— Select type —</option>
            {MATERIAL_PRESETS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {isCustom && (
            <input
              className="input-field mt-2"
              value={row.description}
              onChange={e => onChange('description', e.target.value)}
              placeholder="Describe the custom charge…"
              autoFocus
            />
          )}
        </div>
        <div className="col-span-3">
          <label className="label">Qty</label>
          <input
            className="input-field text-right"
            type="number" min="0" step="0.01"
            value={row.qty}
            onChange={e => onChange('qty', e.target.value)}
            placeholder="1"
          />
        </div>
        <div className="col-span-4">
          <label className="label">Unit Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted text-sm">$</span>
            <input
              className="input-field pl-6 text-right"
              type="number" step="0.01" min="0"
              value={row.unitPrice}
              onChange={e => onChange('unitPrice', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="col-span-5">
          <label className="label">Line Total</label>
          <div className="input-field bg-ivory-300/50 border-ivory-300 font-semibold text-charcoal cursor-default select-none text-right">
            {fmt(rowTotal)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Job Form ──────────────────────────────────────────────────────────────
function JobForm({ initial = {}, contacts = [], onSubmit, onClose }) {
  const defaultLaborItems = initial.laborItems?.length
    ? initial.laborItems
    : [{ description: '', ratePerSqft: '', squareFeet: '' }]

  const defaultLineItems = initial.lineItems?.length
    ? initial.lineItems
    : [{ preset: '', description: '', qty: 1, unitPrice: '' }]

  const [form, setForm] = useState({
    title: initial.title || '',
    contactId: initial.contactId || '',
    clientName: initial.clientName || '',
    address: initial.address || '',
    status: initial.status || 'estimate',
    taxRate: initial.taxRate || '0',
    notes: initial.notes || '',
  })
  const [laborItems, setLaborItems] = useState(defaultLaborItems)
  const [lineItems, setLineItems] = useState(defaultLineItems)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const totals = calcTotals(laborItems, lineItems, form.taxRate)

  // Labor helpers
  const addLabor = () => setLaborItems(r => [...r, { description: '', ratePerSqft: '', squareFeet: '' }])
  const removeLabor = (i) => setLaborItems(r => r.filter((_, idx) => idx !== i))
  const updateLabor = (i, field, val) => setLaborItems(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row))

  // Material helpers
  const addMaterial = () => setLineItems(r => [...r, { preset: '', description: '', qty: 1, unitPrice: '' }])
  const removeMaterial = (i) => setLineItems(r => r.filter((_, idx) => idx !== i))
  const updateMaterial = (i, field, val) => setLineItems(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row))

  const handleContactChange = (id) => {
    set('contactId', id)
    const c = contacts.find(c => c.id === id)
    if (c) { set('clientName', c.name); if (c.address) set('address', c.address) }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const cleanLabor = laborItems.map(r => ({
      description: r.description || '',
      ratePerSqft: num(r.ratePerSqft) || 0,
      squareFeet: num(r.squareFeet) || 0,
    }))
    const cleanMaterials = lineItems.map(li => ({
      preset: li.preset || '',
      description: li.description || (li.preset && li.preset !== 'Custom…' ? li.preset : '') || '',
      qty: num(li.qty) || 1,
      unitPrice: num(li.unitPrice) || 0,
    }))
    onClose()
    onSubmit({ ...form, laborItems: cleanLabor, lineItems: cleanMaterials, ...totals })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Job basics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Job Title *</label>
          <input className="input-field" required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Roof replacement — 123 Main St" />
        </div>
        <div>
          <label className="label">Client (from CRM)</label>
          <select className="input-field" value={form.contactId} onChange={e => handleContactChange(e.target.value)}>
            <option value="">— Select Contact —</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Client Name</label>
          <input className="input-field" value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Or type manually" />
        </div>
        <div className="col-span-2">
          <label className="label">Job Address</label>
          <input className="input-field" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Project address" />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input-field" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="estimate">Estimate</option>
            <option value="approved">Approved</option>
            <option value="in_progress">In Progress</option>
            <option value="complete">Complete</option>
          </select>
        </div>
      </div>

      {/* ── Labor Calculator ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calculator size={14} className="text-navy" />
            <span className="label mb-0">Area &amp; Labor Calculator</span>
          </div>
          <button type="button" onClick={addLabor} className="text-xs text-navy font-medium hover:underline flex items-center gap-1">
            <Plus size={12} /> Add Labor Line
          </button>
        </div>
        <div className="space-y-2">
          {laborItems.map((row, i) => (
            <LaborRow
              key={i}
              index={i}
              row={row}
              onChange={(field, val) => updateLabor(i, field, val)}
              onRemove={() => removeLabor(i)}
            />
          ))}
        </div>

        {/* Labor subtotal bar */}
        <div className="flex items-center justify-between bg-navy/5 border border-navy/10 rounded-xl px-4 py-2.5 mt-2">
          <span className="text-xs font-semibold text-navy">Labor Subtotal</span>
          <span className="text-sm font-bold text-navy">{fmt(totals.laborTotal)}</span>
        </div>
      </div>

      {/* ── Materials & Additional Charges ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="label mb-0">Materials &amp; Additional Charges</span>
          <button type="button" onClick={addMaterial} className="text-xs text-navy font-medium hover:underline flex items-center gap-1">
            <Plus size={12} /> Add Item
          </button>
        </div>
        <div className="space-y-2">
          {lineItems.map((row, i) => (
            <MaterialRow
              key={i}
              index={i}
              row={row}
              onChange={(field, val) => updateMaterial(i, field, val)}
              onRemove={() => removeMaterial(i)}
            />
          ))}
        </div>

        {/* Materials subtotal bar */}
        <div className="flex items-center justify-between bg-ivory-300/60 border border-ivory-300 rounded-xl px-4 py-2.5 mt-2">
          <span className="text-xs font-semibold text-charcoal-muted">Materials Subtotal</span>
          <span className="text-sm font-bold text-charcoal">{fmt(totals.materialsTotal)}</span>
        </div>
      </div>

      {/* ── Totals ── */}
      <div className="rounded-xl border border-ivory-300 bg-ivory/60 p-4">
        <div className="flex items-center gap-3 mb-3">
          <label className="label mb-0 flex-1">Tax Rate (%)</label>
          <input className="input-field w-24 text-right" type="number" step="0.1" min="0" value={form.taxRate} onChange={e => set('taxRate', e.target.value)} />
        </div>
        <div className="space-y-1.5 border-t border-ivory-300 pt-3">
          <div className="flex justify-between text-xs text-charcoal-muted">
            <span>Labor</span><span>{fmt(totals.laborTotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-charcoal-muted">
            <span>Materials &amp; charges</span><span>{fmt(totals.materialsTotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-charcoal-muted border-t border-ivory-300 pt-1.5">
            <span>Subtotal</span><span>{fmt(totals.subtotal)}</span>
          </div>
          {totals.taxAmount > 0 && (
            <div className="flex justify-between text-xs text-charcoal-muted">
              <span>Tax ({form.taxRate}%)</span><span>{fmt(totals.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-charcoal border-t border-ivory-300 pt-2">
            <span>Total</span>
            <span className="text-navy text-base">{fmt(totals.total)}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input-field resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes…" />
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">
          {initial.title ? 'Save Changes' : 'Create Job'}
        </button>
      </div>
    </form>
  )
}

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_LABELS = {
  estimate:    { label: 'Estimate',    cls: 'bg-gray-100 text-gray-500' },
  approved:    { label: 'Approved',    cls: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-100 text-amber-700' },
  complete:    { label: 'Complete',    cls: 'bg-emerald-100 text-emerald-700' },
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function Jobs() {
  const { jobs, contacts } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const handleAdd = async (data) => {
    await toast.promise(createJob(data), {
      loading: 'Creating job…',
      success: `"${data.title}" created`,
      error: 'Failed to create job',
    })
  }

  const handleEdit = async (data) => {
    await toast.promise(updateJob(editing.id, data), {
      loading: 'Saving…',
      success: 'Job updated',
      error: 'Failed to save changes',
    })
    setEditing(null)
  }

  const handleDelete = async () => {
    const title = deleting?.title
    await toast.promise(deleteJob(deleting.id), {
      loading: 'Deleting…',
      success: `"${title}" deleted`,
      error: 'Failed to delete job',
    })
    setDeleting(null)
  }

  return (
    <div className="p-6 page-enter">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-charcoal-muted">{jobs.length} job{jobs.length !== 1 ? 's' : ''} in pipeline</p>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={14} /> New Job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={Briefcase}
            title="No jobs yet"
            description="Create your first job estimate to get started."
            action={<button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={14} /> New Job</button>}
          />
        </div>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => {
            const status = STATUS_LABELS[job.status] || STATUS_LABELS.estimate
            const laborSummary = (job.laborItems || [])
              .filter(r => r.squareFeet)
              .map(r => `${Number(r.squareFeet).toLocaleString()} sqft`)
              .join(', ')
            return (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(22,50,79,0.08)' }}>
                  <Briefcase size={16} style={{ color: 'rgba(22,50,79,0.5)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-medium text-charcoal truncate">{job.title}</p>
                    <span className={`badge ${status.cls}`}>{status.label}</span>
                  </div>
                  <p className="text-xs text-charcoal-muted truncate">
                    {job.clientName || '—'}{job.address ? ` · ${job.address}` : ''}
                  </p>
                  {laborSummary && (
                    <p className="text-xs text-charcoal-muted mt-0.5">{laborSummary}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-navy">{fmt(job.total)}</p>
                  <p className="text-xs text-charcoal-muted">Total</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => generateInvoicePDF(job, 'ESTIMATE')}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(22,50,79,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    title="Download Estimate"
                  >
                    <Download size={13} className="text-navy/60" />
                  </button>
                  <button
                    onClick={() => setEditing(job)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ '--tw-bg-opacity': 1 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(22,50,79,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Edit2 size={13} className="text-charcoal-muted" />
                  </button>
                  <button
                    onClick={() => setDeleting(job)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    onMouseEnter={e => e.currentTarget.style.background = 'rgb(254,242,242)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Job Estimate" width="max-w-2xl">
        <JobForm contacts={contacts} onSubmit={handleAdd} onClose={() => setShowAdd(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Job" width="max-w-2xl">
        {editing && <JobForm initial={editing} contacts={contacts} onSubmit={handleEdit} onClose={() => setEditing(null)} />}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Job"
        message={`Delete "${deleting?.title}"? This cannot be undone.`}
      />
    </div>
  )
}
