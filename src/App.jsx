import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './services/firebase'
import { useStore } from './store/useStore'
import { subscribeToContacts } from './services/contacts'
import { subscribeToJobs } from './services/jobs'
import { subscribeToInvoices } from './services/invoices'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CRM from './pages/CRM'
import Jobs from './pages/Jobs'
import Invoices from './pages/Invoices'
import { AnimatePresence, motion } from 'framer-motion'

export default function App() {
  const { user, setUser, setContacts, setJobs, setInvoices, activePage } = useStore()

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u))
  }, [])

  // Data subscriptions (only when authenticated)
  useEffect(() => {
    if (!user) return
    const unsubs = [
      subscribeToContacts(setContacts),
      subscribeToJobs(setJobs),
      subscribeToInvoices(setInvoices),
    ]
    return () => unsubs.forEach(u => u())
  }, [user])

  if (!user) return <Login />

  const pages = { dashboard: Dashboard, crm: CRM, jobs: Jobs, invoices: Invoices }
  const Page = pages[activePage] || Dashboard

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Page />
        </motion.div>
      </AnimatePresence>
    </Layout>
  )
}
