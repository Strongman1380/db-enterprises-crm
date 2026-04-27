import { motion } from 'framer-motion'
import { DollarSign, Users, FileText, TrendingUp, Clock, CheckCircle, AlertCircle, Briefcase } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useStore } from '../store/useStore'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildRevenueData(invoices) {
  const now = new Date()
  const buckets = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    buckets[key] = { month: MONTHS[d.getMonth()], paid: 0, outstanding: 0 }
  }
  invoices.forEach((inv) => {
    const d = new Date(inv.issueDate || (inv.createdAt?.seconds ? inv.createdAt.seconds * 1000 : null))
    if (!d || isNaN(d)) return
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!buckets[key]) return
    const amount = inv.total || 0
    if (inv.status === 'paid') buckets[key].paid += amount
    else if (inv.status === 'sent' || inv.status === 'overdue') buckets[key].outstanding += amount
  })
  return Object.values(buckets)
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  return (
    <div className="bg-charcoal text-ivory text-xs rounded-xl px-3 py-2 shadow-lg space-y-1">
      <p className="font-semibold text-gold">{label}</p>
      {payload.map(p => (
        <p key={p.name}>{p.name === 'paid' ? 'Paid' : 'Outstanding'}: {fmt(p.value)}</p>
      ))}
    </div>
  )
}

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
}

export default function Dashboard() {
  const { getStats, invoices, contacts, setActivePage } = useStore()
  const stats = getStats()
  const revenueData = buildRevenueData(invoices)

  const recentInvoices = invoices.slice(0, 5)
  const recentContacts = contacts.slice(0, 5)

  const statCards = [
    {
      label: 'Total Revenue',
      value: fmt(stats.revenue),
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600',
      trend: 'Paid invoices',
    },
    {
      label: 'Outstanding',
      value: fmt(stats.outstanding),
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
      trend: 'Awaiting payment',
    },
    {
      label: 'Contacts',
      value: stats.contacts,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      trend: 'Total in CRM',
    },
    {
      label: 'Active Jobs',
      value: stats.jobs,
      icon: Briefcase,
      color: 'bg-purple-50 text-purple-600',
      trend: 'In pipeline',
    },
  ]

  return (
    <div className="page-enter w-full max-w-full overflow-x-hidden p-4 sm:p-6">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-charcoal">Good morning</h2>
        <p className="text-sm text-charcoal-muted mt-0.5">Here's what's happening with DB Enterprises today.</p>
      </div>

      {/* Stats */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={stagger.container}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {statCards.map((card) => (
          <motion.div key={card.label} variants={stagger.item} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">{card.label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon size={15} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{card.value}</p>
              <p className="text-xs text-charcoal-muted mt-0.5">{card.trend}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Invoice status summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="glass-card p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-charcoal">Invoice Pipeline</h3>
          <button onClick={() => setActivePage('invoices')} className="text-xs text-navy font-medium hover:underline">View all</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Draft', count: stats.draft, icon: FileText, cls: 'bg-gray-100 text-gray-500' },
            { label: 'Not Paid', count: stats.sent, icon: Clock, cls: 'bg-blue-100 text-blue-600' },
            { label: 'Partial', count: stats.partial, icon: AlertCircle, cls: 'bg-amber-100 text-amber-600' },
            { label: 'Paid', count: stats.paid, icon: CheckCircle, cls: 'bg-emerald-100 text-emerald-600' },
          ].map(({ label, count, icon: Icon, cls }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-ivory/60">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cls}`}>
                <Icon size={15} />
              </div>
              <div>
                <p className="text-lg font-bold text-charcoal leading-none">{count}</p>
                <p className="text-xs text-charcoal-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Revenue Over Time */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.3 }}
        className="glass-card p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-charcoal">Revenue — Last 6 Months</h3>
          <div className="flex items-center gap-3 text-xs text-charcoal-muted">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-navy inline-block" />Paid</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gold/60 inline-block" />Outstanding</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={revenueData} barSize={18} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE9E1" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(22,50,79,0.04)', radius: 6 }} />
            <Bar dataKey="paid" fill="#16324F" radius={[4, 4, 0, 0]} />
            <Bar dataKey="outstanding" fill="#C8A96B" opacity={0.65} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Two-column: recent invoices + recent contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Invoices */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.3 }}
          className="glass-card overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-ivory-300/60">
            <h3 className="text-sm font-semibold text-charcoal">Recent Invoices</h3>
            <button onClick={() => setActivePage('invoices')} className="text-xs text-navy font-medium hover:underline">View all</button>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="py-10 text-center text-xs text-charcoal-muted">No invoices yet</div>
          ) : (
            <div>
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="table-row flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-charcoal">{inv.invoiceNumber || inv.id.slice(0, 8)}</p>
                    <p className="text-xs text-charcoal-muted">{inv.clientName || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-charcoal">{fmt(inv.total || 0)}</p>
                    <span className={`badge-${inv.status || 'draft'} badge`}>{inv.status || 'draft'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.3 }}
          className="glass-card overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-ivory-300/60">
            <h3 className="text-sm font-semibold text-charcoal">Recent Contacts</h3>
            <button onClick={() => setActivePage('crm')} className="text-xs text-navy font-medium hover:underline">View all</button>
          </div>
          {recentContacts.length === 0 ? (
            <div className="py-10 text-center text-xs text-charcoal-muted">No contacts yet</div>
          ) : (
            <div>
              {recentContacts.map((c) => (
                <div key={c.id} className="table-row flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-xl bg-navy/10 flex items-center justify-center text-navy text-xs font-bold flex-shrink-0">
                    {(c.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate">{c.name}</p>
                    <p className="text-xs text-charcoal-muted truncate">{c.email || c.phone || '—'}</p>
                  </div>
                  <span className={c.type === 'customer' ? 'badge-customer' : 'badge-lead'}>
                    {c.type || 'lead'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
