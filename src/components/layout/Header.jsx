import { Bell, Search } from 'lucide-react'
import { useStore } from '../../store/useStore'

const pageTitles = {
  dashboard: 'Dashboard',
  crm: 'CRM & Contacts',
  jobs: 'Job Builder',
  invoices: 'Invoices',
}

export default function Header() {
  const { activePage, user } = useStore()

  return (
    <header className="h-14 min-w-0 flex items-center justify-between gap-3 px-4 sm:px-6 bg-ivory/80 backdrop-blur-sm border-b border-ivory-300/80 sticky top-0 z-10 pt-safe">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold text-charcoal">{pageTitles[activePage]}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {/* Search placeholder */}
        <div className="hidden md:flex items-center gap-2 bg-white/80 border border-ivory-300 rounded-xl px-3 py-1.5 text-sm text-charcoal-muted/60 w-48">
          <Search size={14} />
          <span className="text-xs">Search...</span>
        </div>

        <button className="hidden sm:flex w-8 h-8 rounded-xl bg-white/80 border border-ivory-300 items-center justify-center hover:bg-white transition-colors">
          <Bell size={14} className="text-charcoal-muted" />
        </button>

        <div className="w-8 h-8 rounded-xl bg-navy flex items-center justify-center text-xs font-bold text-gold">
          {user?.email?.charAt(0).toUpperCase() || 'D'}
        </div>
      </div>
    </header>
  )
}
