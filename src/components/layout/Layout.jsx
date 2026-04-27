import { Toaster } from 'react-hot-toast'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileNav from './MobileNav'

export default function Layout({ children }) {
  return (
    <div className="flex h-dvh w-full max-w-full overflow-hidden bg-ivory">
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#22262B',
            color: '#F7F5F0',
            fontSize: '13px',
            fontWeight: 500,
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 4px 24px rgba(22,50,79,0.18)',
          },
          success: {
            iconTheme: { primary: '#C8A96B', secondary: '#22262B' },
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: '#22262B' },
          },
        }}
      />
      <div className="hidden md:block h-full">
        <Sidebar />
      </div>
      <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
        <Header />
        <MobileNav />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
