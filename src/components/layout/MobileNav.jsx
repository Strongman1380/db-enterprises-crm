import { Briefcase, FileText, LayoutDashboard, Users } from 'lucide-react'
import { useStore } from '../../store/useStore'

const navItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'crm', label: 'Contacts', icon: Users },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'invoices', label: 'Invoices', icon: FileText },
]

export default function MobileNav() {
  const { activePage, setActivePage } = useStore()

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-navy/95 backdrop-blur-lg pb-safe">
      <div className="grid grid-cols-4 px-2 pt-2">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = activePage === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActivePage(id)}
              className={`flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition-colors ${
                active ? 'bg-gold/15 text-gold' : 'text-ivory/70'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
