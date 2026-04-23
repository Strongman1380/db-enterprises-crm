import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, FileText, Briefcase,
  ChevronLeft, ChevronRight, LogOut, Settings
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { auth } from '../../services/firebase'
import { signOut } from 'firebase/auth'
import logoUrl from '/assets/images/logo_dynamic.png'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'crm', label: 'CRM & Contacts', icon: Users },
  { id: 'jobs', label: 'Job Builder', icon: Briefcase },
  { id: 'invoices', label: 'Invoices', icon: FileText },
]

export default function Sidebar() {
  const { activePage, setActivePage, sidebarOpen, toggleSidebar } = useStore()

  const handleSignOut = async () => {
    await signOut(auth)
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 240 : 72 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col h-full flex-shrink-0 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #16324F 0%, #0e253b 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <img src={logoUrl} alt="DB Enterprises" className="w-9 h-9 object-contain flex-shrink-0" />
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-ivory font-semibold text-sm leading-tight">DB Enterprises</p>
              <p className="text-gold/70 text-xs">CRM & Invoicing</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = activePage === id
          return (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`sidebar-link w-full ${active ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.18 }}
                    className="truncate"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 space-y-1 border-t border-white/10 pt-3">
        <button
          onClick={handleSignOut}
          className="sidebar-link sidebar-link-inactive w-full"
          title={!sidebarOpen ? 'Sign Out' : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute top-6 -right-3 w-6 h-6 bg-gold rounded-full flex items-center justify-center shadow-md z-10 hover:bg-gold-400 transition-colors"
      >
        {sidebarOpen
          ? <ChevronLeft size={12} className="text-navy" />
          : <ChevronRight size={12} className="text-navy" />
        }
      </button>
    </motion.aside>
  )
}
