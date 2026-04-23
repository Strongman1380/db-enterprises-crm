import { useState } from 'react'
import { motion } from 'framer-motion'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../services/firebase'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import bannerUrl from '/assets/images/Banner.png'
import logoUrl from '/assets/images/logo_dynamic.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — branding panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-end p-12 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #16324F 0%, #0a1e30 100%)' }}
      >
        <img
          src={bannerUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-15"
        />
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-sm">
            <img src={logoUrl} alt="DB Enterprises" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-ivory leading-tight mb-3">
            DB Enterprises
          </h1>
          <p className="text-gold/80 text-lg font-light">
            CRM & Invoicing Platform
          </p>
          <p className="text-ivory/40 text-sm mt-4 max-w-xs leading-relaxed">
            Manage contacts, build job estimates, and generate professional invoices — all in one place.
          </p>

          {/* Feature bullets */}
          <div className="mt-8 space-y-3">
            {['Lead & customer management', 'Automated job estimation', 'Professional PDF invoicing'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                <span className="text-ivory/60 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-ivory">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={logoUrl} alt="DB Enterprises" className="w-10 h-10 object-contain" />
            <div>
              <p className="font-bold text-navy">DB Enterprises</p>
              <p className="text-xs text-charcoal-muted">CRM & Invoicing</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-charcoal mb-1">Welcome back</h2>
          <p className="text-sm text-charcoal-muted mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted/50" />
                <input
                  className="input-field pl-9"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted/50" />
                <input
                  className="input-field pl-9 pr-10"
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted/50 hover:text-charcoal-muted"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-3 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
