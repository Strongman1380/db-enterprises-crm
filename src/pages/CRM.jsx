import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Plus, Search, Users, Phone, Mail, Tag,
  Trash2, Edit2, ChevronRight, Download, X,
  Upload, FileText, AlertCircle, CheckCircle2, ClipboardPaste
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { createContact, updateContact, deleteContact } from '../services/contacts'
import { useDebounce } from '../hooks/useDebounce'
import { contactSchema, validate } from '../lib/schemas'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'

const TAGS = ['Roofing', 'Siding', 'Gutters', 'Commercial', 'Residential', 'Referred', 'Repeat']

// ─── CSV parsing helpers ──────────────────────────────────────────────────────

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

const HEADER_ALIASES = {
  name:    ['name', 'full name', 'contact name', 'customer name', 'client name', 'first name'],
  email:   ['email', 'email address', 'e-mail', 'e mail'],
  phone:   ['phone', 'phone number', 'cell', 'mobile', 'telephone', 'tel'],
  address: ['address', 'street address', 'location', 'street'],
  type:    ['type', 'contact type', 'status', 'role'],
  tags:    ['tags', 'tag', 'categories', 'category', 'services', 'service'],
  notes:   ['notes', 'note', 'comments', 'comment', 'description', 'details'],
}

function parseContactsCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { rows: [], headerError: 'Paste or upload at least a header row and one data row.' }

  const rawHeaders = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, '').trim())

  // Map each field to its column index (first alias match wins)
  const colIdx = {}
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const idx = rawHeaders.findIndex(h => aliases.some(a => h === a || h.includes(a)))
    if (idx !== -1) colIdx[field] = idx
  }

  if (colIdx.name === undefined) {
    return { rows: [], headerError: 'Could not find a "name" column. Check your headers.' }
  }

  const rows = lines.slice(1).map((line, i) => {
    const cells = parseCSVLine(line)
    const get = (field) => (colIdx[field] !== undefined ? cells[colIdx[field]]?.replace(/^"|"$/g, '').trim() : '') || ''

    const rawType = get('type').toLowerCase()
    const type = ['customer', 'client'].includes(rawType)
      ? 'customer'
      : rawType === 'prospect'
        ? 'prospect'
        : 'lead'

    const rawTags = get('tags')
    const tags = rawTags
      ? rawTags.split(/[;|]/).map(t => t.trim()).filter(Boolean).map(t => {
          const match = TAGS.find(tag => tag.toLowerCase() === t.toLowerCase())
          return match ?? t
        })
      : []

    const data = { name: get('name'), email: get('email'), phone: get('phone'), address: get('address'), type, tags, notes: get('notes') }
    const errors = data.name ? [] : ['Name is required']

    return { data, errors, rowNumber: i + 2 }
  }).filter(r => r.data.name || r.errors.length) // drop fully empty rows

  return { rows }
}

// ─── Import modal ─────────────────────────────────────────────────────────────

const CSV_TEMPLATE = [
  'name,email,phone,address,type,tags,notes',
  '"Jane Doe","jane@example.com","(402) 555-0101","456 Oak Ave, Omaha NE 68102","lead","Roofing;Residential","Hail damage from last storm"',
  '"Acme Corp","info@acme.com","(402) 555-0202","789 Commerce Blvd, Lincoln NE 68501","customer","Commercial;Gutters","Annual maintenance contract"',
].join('\n')

function ImportContactsModal({ onClose, onImport }) {
  const [tab, setTab] = useState('upload')
  const [pasteText, setPasteText] = useState('')
  const [parsed, setParsed] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef(null)

  const processText = (text) => {
    const result = parseContactsCSV(text)
    setParsed(result)
  }

  const handleFile = (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      toast.error('Please select a .csv file')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => processText(e.target.result)
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'db-enterprises-contacts-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const validRows = parsed?.rows?.filter(r => r.errors.length === 0) ?? []
  const errorRows = parsed?.rows?.filter(r => r.errors.length > 0) ?? []

  const handleImport = async () => {
    if (!validRows.length) return
    setImporting(true)
    try {
      await onImport(validRows.map(r => r.data))
      onClose()
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-ivory-300/60 rounded-xl">
        {[
          { id: 'upload', label: 'Upload CSV', icon: Upload },
          { id: 'paste',  label: 'Paste Text', icon: ClipboardPaste },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setParsed(null) }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              tab === id
                ? 'bg-white text-charcoal shadow-sm'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Template download */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-ivory/60 border border-ivory-300/80">
        <div>
          <p className="text-xs font-medium text-charcoal">CSV Format</p>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Columns: <span className="font-mono">name, email, phone, address, type, tags, notes</span>
          </p>
          <p className="text-xs text-charcoal-muted">Tags: separate multiple with semicolons <span className="font-mono">(Roofing;Residential)</span></p>
        </div>
        <button onClick={downloadTemplate} className="btn-ghost text-xs ml-3 whitespace-nowrap flex-shrink-0">
          <Download size={12} /> Template
        </button>
      </div>

      {/* Upload tab */}
      {tab === 'upload' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            dragOver
              ? 'border-navy bg-navy/5'
              : 'border-ivory-300 hover:border-navy/40 hover:bg-ivory/40'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <Upload size={22} className={dragOver ? 'text-navy' : 'text-charcoal-muted/50'} />
          <p className="text-sm font-medium text-charcoal">Drop a CSV file here</p>
          <p className="text-xs text-charcoal-muted">or click to browse</p>
        </div>
      )}

      {/* Paste tab */}
      {tab === 'paste' && (
        <div className="space-y-2">
          <textarea
            className="input-field resize-none font-mono text-xs"
            rows={7}
            placeholder={`Paste CSV text here, e.g.:\n\nname,email,phone,type\nJane Doe,jane@example.com,(402) 555-0101,lead`}
            value={pasteText}
            onChange={(e) => { setPasteText(e.target.value); setParsed(null) }}
          />
          <button
            onClick={() => processText(pasteText)}
            disabled={!pasteText.trim()}
            className="btn-primary w-full justify-center disabled:opacity-40"
          >
            <FileText size={13} /> Parse Text
          </button>
        </div>
      )}

      {/* Header error */}
      {parsed?.headerError && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">{parsed.headerError}</p>
        </div>
      )}

      {/* Preview results */}
      {parsed && !parsed.headerError && (
        <div className="space-y-3">
          {/* Summary badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 border border-green-200 text-xs font-medium text-green-700">
              <CheckCircle2 size={12} /> {validRows.length} ready to import
            </span>
            {errorRows.length > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                <AlertCircle size={12} /> {errorRows.length} row{errorRows.length > 1 ? 's' : ''} with errors (skipped)
              </span>
            )}
          </div>

          {/* Preview table */}
          {parsed.rows.length > 0 && (
            <div className="overflow-auto max-h-52 rounded-xl border border-ivory-300/80">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-ivory/60 border-b border-ivory-300/60">
                    <th className="text-left px-3 py-2 text-charcoal-muted font-medium">#</th>
                    <th className="text-left px-3 py-2 text-charcoal-muted font-medium">Name</th>
                    <th className="text-left px-3 py-2 text-charcoal-muted font-medium hidden sm:table-cell">Email</th>
                    <th className="text-left px-3 py-2 text-charcoal-muted font-medium">Type</th>
                    <th className="text-left px-3 py-2 text-charcoal-muted font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((row, i) => (
                    <tr key={i} className={`border-b border-ivory-300/40 last:border-0 ${row.errors.length ? 'bg-red-50/50' : ''}`}>
                      <td className="px-3 py-2 text-charcoal-muted">{row.rowNumber}</td>
                      <td className="px-3 py-2 font-medium text-charcoal">{row.data.name || <span className="text-red-400 italic">missing</span>}</td>
                      <td className="px-3 py-2 text-charcoal-muted hidden sm:table-cell">{row.data.email || '—'}</td>
                      <td className="px-3 py-2">
                        <span className={row.data.type === 'customer' ? 'badge-customer' : 'badge-lead'}>
                          {row.data.type}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {row.errors.length === 0
                          ? <span className="text-green-600"><CheckCircle2 size={13} /></span>
                          : <span className="text-red-500 flex items-center gap-1"><AlertCircle size={13} />{row.errors[0]}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Import action */}
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            <button
              onClick={handleImport}
              disabled={!validRows.length || importing}
              className="btn-primary disabled:opacity-40"
            >
              {importing
                ? 'Importing…'
                : `Import ${validRows.length} Contact${validRows.length !== 1 ? 's' : ''}`
              }
            </button>
          </div>
        </div>
      )}

      {/* Empty state when no results yet */}
      {!parsed && (
        <div className="flex justify-end">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
        </div>
      )}
    </div>
  )
}

function ContactForm({ initial = {}, onSubmit, onClose }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    email: initial.email || '',
    phone: initial.phone || '',
    address: initial.address || '',
    type: initial.type || 'lead',
    tags: initial.tags || [],
    notes: initial.notes || '',
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }))
  }

  const toggleTag = (tag) => {
    set('tags', form.tags.includes(tag)
      ? form.tags.filter(t => t !== tag)
      : [...form.tags, tag]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const fieldErrors = validate(contactSchema, form)
    if (fieldErrors) { setErrors(fieldErrors); return }
    onClose()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Full Name *</label>
          <input
            className={`input-field ${errors.name ? 'border-red-400 focus:ring-red-300' : ''}`}
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="John Smith"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className={`input-field ${errors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="john@example.com"
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(402) 555-0100" />
        </div>
        <div className="col-span-2">
          <label className="label">Address</label>
          <input className="input-field" value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St, City, NE" />
        </div>
        <div>
          <label className="label">Contact Type</label>
          <select className="input-field" value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="lead">Lead</option>
            <option value="customer">Customer</option>
            <option value="prospect">Prospect</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Tags</label>
        <div className="flex flex-wrap gap-2">
          {TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                form.tags.includes(tag)
                  ? 'bg-navy text-ivory'
                  : 'bg-ivory-300 text-charcoal-muted hover:bg-ivory-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea
          className="input-field resize-none"
          rows={3}
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Any additional notes..."
        />
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">
          {initial.name ? 'Save Changes' : 'Add Contact'}
        </button>
      </div>
    </form>
  )
}

function ContactDetail({ contact, onEdit, onDelete, onClose }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-navy flex items-center justify-center text-gold text-xl font-bold flex-shrink-0">
          {contact.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold text-charcoal">{contact.name}</h3>
          <span className={contact.type === 'customer' ? 'badge-customer' : 'badge-lead'}>{contact.type || 'lead'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {contact.email && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-ivory/60">
            <Mail size={14} className="text-charcoal-muted" />
            <div>
              <p className="text-xs text-charcoal-muted">Email</p>
              <p className="text-sm text-charcoal">{contact.email}</p>
            </div>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-ivory/60">
            <Phone size={14} className="text-charcoal-muted" />
            <div>
              <p className="text-xs text-charcoal-muted">Phone</p>
              <p className="text-sm text-charcoal">{contact.phone}</p>
            </div>
          </div>
        )}
      </div>

      {contact.address && (
        <div className="p-3 rounded-xl bg-ivory/60">
          <p className="text-xs text-charcoal-muted mb-0.5">Address</p>
          <p className="text-sm text-charcoal">{contact.address}</p>
        </div>
      )}

      {contact.tags?.length > 0 && (
        <div>
          <p className="text-xs text-charcoal-muted mb-2">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {contact.tags.map(tag => (
              <span key={tag} className="px-2.5 py-1 bg-navy/8 text-navy text-xs font-medium rounded-lg">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {contact.notes && (
        <div className="p-3 rounded-xl bg-ivory/60">
          <p className="text-xs text-charcoal-muted mb-0.5">Notes</p>
          <p className="text-sm text-charcoal">{contact.notes}</p>
        </div>
      )}

      {/* Activity */}
      {contact.activities?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-2">Activity</p>
          <div className="space-y-2">
            {contact.activities.slice(-5).reverse().map((a, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-charcoal">{a.message}</p>
                  <p className="text-charcoal-muted">{new Date(a.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onEdit} className="btn-ghost flex-1 justify-center">
          <Edit2 size={14} /> Edit
        </button>
        <button onClick={onDelete} className="btn-danger flex-1 justify-center">
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  )
}

export default function CRM() {
  const { contacts, user } = useStore()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [filterType, setFilterType] = useState('all')
  const [filterTag, setFilterTag] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const filtered = contacts.filter(c => {
    const q = debouncedSearch.toLowerCase()
    const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q)
    const matchType = filterType === 'all' || c.type === filterType
    const matchTag = !filterTag || c.tags?.includes(filterTag)
    return matchSearch && matchType && matchTag
  })

  const handleAdd = async (data) => {
    await toast.promise(createContact(data, user.uid), {
      loading: 'Adding contact…',
      success: `${data.name} added`,
      error: 'Failed to add contact',
    })
  }

  const handleBulkImport = async (rows) => {
    await toast.promise(
      Promise.all(rows.map(data => createContact(data, user.uid))),
      {
        loading: `Importing ${rows.length} contact${rows.length !== 1 ? 's' : ''}…`,
        success: `${rows.length} contact${rows.length !== 1 ? 's' : ''} imported`,
        error: 'Import failed — some contacts may not have been saved',
      }
    )
  }

  const handleEdit = async (data) => {
    await toast.promise(updateContact(editing.id, data, user.uid), {
      loading: 'Saving…',
      success: 'Contact updated',
      error: 'Failed to save changes',
    })
    setEditing(null)
  }

  const handleDelete = async () => {
    const name = deleting?.name
    await toast.promise(deleteContact(deleting.id), {
      loading: 'Deleting…',
      success: `${name} deleted`,
      error: 'Failed to delete contact',
    })
    setViewing(null)
    setDeleting(null)
  }

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'Address', 'Type', 'Tags'],
      ...filtered.map(c => [c.name, c.email, c.phone, c.address, c.type, (c.tags || []).join('; ')]),
    ]
    const csv = rows.map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `db-enterprises-contacts-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const allTags = [...new Set(contacts.flatMap(c => c.tags || []))]

  return (
    <div className="page-enter w-full max-w-full overflow-x-hidden p-4 sm:p-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted/50" />
          <input
            className="input-field pl-9"
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          <select className="input-field w-auto" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="lead">Leads</option>
            <option value="customer">Customers</option>
            <option value="prospect">Prospects</option>
          </select>
          {allTags.length > 0 && (
            <select className="input-field w-auto" value={filterTag} onChange={e => setFilterTag(e.target.value)}>
              <option value="">All Tags</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <button onClick={exportCSV} className="btn-ghost" title="Export CSV">
            <Download size={14} />
          </button>
          <button onClick={() => setShowImport(true)} className="btn-ghost whitespace-nowrap" title="Import contacts from CSV">
            <Upload size={14} /> Import
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary whitespace-nowrap">
            <Plus size={14} /> Add Contact
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={contacts.length === 0 ? 'No contacts yet' : 'No results'}
            description={contacts.length === 0
              ? 'Add your first contact to start building your CRM.'
              : 'Try adjusting your search or filters.'}
            action={contacts.length === 0 && (
              <button onClick={() => setShowAdd(true)} className="btn-primary">
                <Plus size={14} /> Add Contact
              </button>
            )}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ivory-300/60 bg-ivory/40">
                <th className="table-header">Name</th>
                <th className="table-header hidden md:table-cell">Contact</th>
                <th className="table-header hidden lg:table-cell">Address</th>
                <th className="table-header">Type</th>
                <th className="table-header hidden md:table-cell">Tags</th>
                <th className="table-header w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => (
                <tr
                  key={contact.id}
                  className="table-row cursor-pointer"
                  onClick={() => setViewing(contact)}
                >
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-navy/10 flex items-center justify-center text-navy text-xs font-bold flex-shrink-0">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{contact.name}</span>
                    </div>
                  </td>
                  <td className="table-cell hidden md:table-cell">
                    <div className="space-y-0.5">
                      {contact.email && <p className="text-xs">{contact.email}</p>}
                      {contact.phone && <p className="text-xs text-charcoal-muted">{contact.phone}</p>}
                    </div>
                  </td>
                  <td className="table-cell hidden lg:table-cell text-xs text-charcoal-muted">{contact.address || '—'}</td>
                  <td className="table-cell">
                    <span className={contact.type === 'customer' ? 'badge-customer' : 'badge-lead'}>
                      {contact.type || 'lead'}
                    </span>
                  </td>
                  <td className="table-cell hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(contact.tags || []).slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-navy/6 text-navy text-xs rounded-md">{tag}</span>
                      ))}
                      {(contact.tags || []).length > 2 && (
                        <span className="text-xs text-charcoal-muted">+{contact.tags.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <ChevronRight size={14} className="text-charcoal-muted/40" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-charcoal-muted mt-3 px-1">{filtered.length} of {contacts.length} contacts</p>

      {/* Import modal */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="Import Contacts" width="max-w-2xl">
        <ImportContactsModal onClose={() => setShowImport(false)} onImport={handleBulkImport} />
      </Modal>

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Contact">
        <ContactForm onSubmit={handleAdd} onClose={() => setShowAdd(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Contact">
        {editing && <ContactForm initial={editing} onSubmit={handleEdit} onClose={() => setEditing(null)} />}
      </Modal>

      {/* View detail */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Contact Details">
        {viewing && (
          <ContactDetail
            contact={viewing}
            onEdit={() => { setEditing(viewing); setViewing(null) }}
            onDelete={() => setDeleting(viewing)}
            onClose={() => setViewing(null)}
          />
        )}
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Contact"
        message={`Are you sure you want to delete ${deleting?.name}? This cannot be undone.`}
      />
    </div>
  )
}
