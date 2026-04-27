import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Plus, Search, Users, Phone, Mail, Tag,
  Trash2, Edit2, ChevronRight, Download, X
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { createContact, updateContact, deleteContact } from '../services/contacts'
import { useDebounce } from '../hooks/useDebounce'
import { contactSchema, validate } from '../lib/schemas'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'

const TAGS = ['Roofing', 'Siding', 'Gutters', 'Commercial', 'Residential', 'Referred', 'Repeat']

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
      <div className="grid grid-cols-2 gap-3">
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

      <div className="grid grid-cols-2 gap-3">
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
    <div className="p-6 page-enter">
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
        <div className="flex gap-2">
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
