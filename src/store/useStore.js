import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user }),

  // Navigation
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),

  // Contacts
  contacts: [],
  setContacts: (contacts) => set({ contacts }),
  selectedContact: null,
  setSelectedContact: (contact) => set({ selectedContact: contact }),

  // Jobs
  jobs: [],
  setJobs: (jobs) => set({ jobs }),

  // Invoices
  invoices: [],
  setInvoices: (invoices) => set({ invoices }),

  // UI
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  modal: null,
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),

  // Derived helpers
  getContactById: (id) => get().contacts.find(c => c.id === id),
  getJobById: (id) => get().jobs.find(j => j.id === id),

  // Stats
  getStats: () => {
    const { contacts, jobs, invoices } = get()
    const paid = invoices.filter(i => i.status === 'paid')
    const partial = invoices.filter(i => i.status === 'partial')
    const sent = invoices.filter(i => i.status === 'sent')
    const draft = invoices.filter(i => i.status === 'draft')
    const revenue = paid.reduce((s, i) => s + (i.total || 0), 0)
    const outstanding = [...sent, ...partial].reduce((s, i) => s + (i.total || 0), 0)
    return { contacts: contacts.length, jobs: jobs.length, revenue, outstanding, paid: paid.length, partial: partial.length, sent: sent.length, draft: draft.length }
  },
}))
